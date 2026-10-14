import { access, readFile, stat } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

export const CONTRACT_VERSION = 1;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function stringValue(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function environmentKeys(environment) {
  if (Array.isArray(environment)) {
    return sortedUnique(environment
      .filter((item) => typeof item === "string")
      .map((item) => item.split("=", 1)[0].trim())
      .filter(Boolean));
  }
  if (isObject(environment)) return sortedUnique(Object.keys(environment));
  return [];
}

function dependencyNames(dependsOn) {
  if (Array.isArray(dependsOn)) return sortedUnique(dependsOn.filter((item) => typeof item === "string"));
  if (isObject(dependsOn)) return sortedUnique(Object.keys(dependsOn));
  return [];
}

function normalizePort(port) {
  if (typeof port === "string") return port;
  if (!isObject(port)) return null;
  const normalized = {};
  for (const key of ["host_ip", "published", "target", "protocol"]) {
    if (port[key] !== undefined && port[key] !== null) normalized[key] = port[key];
  }
  return normalized;
}

function parseVolumeString(value) {
  const pieces = value.split(":");
  const modes = new Set();
  while (pieces.length > 1 && /^(?:ro|rw|z|Z|nocopy)$/.test(pieces.at(-1))) {
    modes.add(pieces.pop());
  }
  const target = pieces.pop() ?? "";
  const source = pieces.join(":");
  const isBind = source.startsWith(".") || source.startsWith("/") || /^[A-Za-z]:[\\/]/.test(source);
  return {
    type: isBind ? "bind" : "named",
    source: source || null,
    target,
    readOnly: modes.has("ro"),
  };
}

function normalizeMount(mount) {
  if (typeof mount === "string") return parseVolumeString(mount);
  if (!isObject(mount)) return null;
  const type = mount.type === "bind" ? "bind" : "named";
  return {
    type,
    source: stringValue(mount.source),
    target: stringValue(mount.target) ?? "",
    readOnly: mount.read_only === true || mount.readOnly === true,
  };
}

function normalizeMounts(volumes) {
  if (!Array.isArray(volumes)) return [];
  return volumes
    .map(normalizeMount)
    .filter((mount) => mount && mount.target)
    .sort((left, right) => left.target.localeCompare(right.target));
}

function serviceWarnings(service) {
  const image = service.image ?? "";
  if (!/(postgres|mysql|mariadb|mongo|redis|elasticsearch)/i.test(image)) return [];
  return [`${service.name} looks stateful: use a logical dump or database-aware snapshot before copying raw data.`];
}

export function captureCompose(compose) {
  if (!isObject(compose) || !isObject(compose.services)) {
    throw new Error("Compose input must contain a services object");
  }

  const services = Object.keys(compose.services)
    .sort((left, right) => left.localeCompare(right))
    .map((name) => {
      const service = compose.services[name];
      if (!isObject(service)) throw new Error(`Service must be an object: ${name}`);
      return {
        name,
        image: stringValue(service.image),
        dependsOn: dependencyNames(service.depends_on),
        envKeys: environmentKeys(service.environment),
        ports: Array.isArray(service.ports) ? service.ports.map(normalizePort).filter(Boolean) : [],
        mounts: normalizeMounts(service.volumes),
        restart: stringValue(service.restart),
      };
    });

  const warnings = services.flatMap(serviceWarnings).sort((left, right) => left.localeCompare(right));
  return {
    version: CONTRACT_VERSION,
    generatedBy: "restorecontract",
    composeVersion: stringValue(compose.version),
    services,
    namedVolumes: isObject(compose.volumes) ? Object.keys(compose.volumes).sort() : [],
    networks: isObject(compose.networks) ? Object.keys(compose.networks).sort() : [],
    warnings,
  };
}

function markdownCell(value) {
  return String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function mountLabel(mount) {
  const source = mount.source ?? "anonymous";
  return `${source} → ${mount.target}${mount.readOnly ? " (read-only)" : ""}`;
}

export function renderMarkdown(contract) {
  const lines = [
    "# Restore Contract",
    "",
    "> Generated locally by RestoreContract. Secret values are intentionally omitted.",
    "",
    `- Contract version: ${contract.version}`,
    `- Services: ${contract.services.length}`,
    `- Named volumes: ${contract.namedVolumes.length}`,
    `- Networks: ${contract.networks.length}`,
    "",
    "## Services",
    "",
    "| Service | Image | Depends on | Ports | Persistent paths | Environment keys |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const service of contract.services) {
    lines.push([
      service.name,
      service.image ?? "—",
      service.dependsOn.join(", ") || "—",
      service.ports.map((port) => typeof port === "string" ? port : JSON.stringify(port)).join(", ") || "—",
      service.mounts.map(mountLabel).join(", ") || "—",
      service.envKeys.join(", ") || "—",
    ].map(markdownCell).join(" | ").replace(/^/, "| ").concat(" |"));
  }

  lines.push("", "## Restore checklist", "", "- [ ] Keep the source Compose file and this contract together.");
  for (const service of contract.services) {
    for (const mount of service.mounts) {
      lines.push(`- [ ] Restore ${service.name} path: ${mountLabel(mount)}`);
    }
    for (const key of service.envKeys) {
      lines.push(`- [ ] Provide environment key \`${key}\` for ${service.name} without committing its value.`);
    }
  }
  for (const volume of contract.namedVolumes) lines.push(`- [ ] Restore named volume \`${volume}\` before starting the stack.`);
  if (contract.services.some((service) => serviceWarnings(service).length)) {
    lines.push("", "## Stateful service warning", "", "- [ ] Take a logical dump or database-aware snapshot before copying raw volume data.");
  }
  if (contract.warnings.length) {
    lines.push("", "## Warnings", "", ...contract.warnings.map((warning) => `- ${warning}`));
  }
  lines.push(
    "",
    "## Scope",
    "",
    "This contract describes what must exist for a recovery. It does not back up data, copy secrets, start containers, or claim that a backup has been restored successfully.",
    "",
  );
  return `${lines.join("\n")}\n`;
}

function parseEnvNames(text) {
  return sortedUnique(text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(?:=|$)/)?.[1])
    .filter(Boolean));
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function requiredEnvironmentKeys(contract) {
  return sortedUnique(contract.services.flatMap((service) => service.envKeys));
}

export async function checkContract(contract, { root = process.cwd(), envFile } = {}) {
  const errors = [];
  const warnings = [...(Array.isArray(contract.warnings) ? contract.warnings : [])];
  const rootPath = resolve(root);

  for (const service of contract.services) {
    for (const mount of service.mounts) {
      if (mount.type !== "bind" || !mount.source || isAbsolute(mount.source)) continue;
      const mountPath = resolve(rootPath, mount.source);
      if (!(await exists(mountPath))) errors.push(`Missing bind mount for ${service.name}: ${mount.source}`);
      else if (!(await stat(mountPath)).isDirectory()) warnings.push(`Bind mount exists but is not a directory: ${mount.source}`);
    }
  }

  const requiredKeys = requiredEnvironmentKeys(contract);
  if (envFile) {
    const absoluteEnvFile = resolve(rootPath, envFile);
    if (!(await exists(absoluteEnvFile))) {
      const suffix = requiredKeys.length ? ` (required keys: ${requiredKeys.join(", ")})` : "";
      errors.push(`Environment file missing: ${envFile}${suffix}`);
    } else {
      const availableKeys = new Set(parseEnvNames(await readFile(absoluteEnvFile, "utf8")));
      for (const key of requiredKeys) {
        if (!availableKeys.has(key)) errors.push(`Environment key missing: ${key}`);
      }
    }
  } else if (requiredKeys.length) {
    warnings.push("Environment presence was not checked; pass --env-file to check names without exposing values.");
  }

  return { ok: errors.length === 0, errors, warnings };
}
