#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import {
  captureCompose,
  checkContract,
  renderMarkdown,
} from "./core.js";

function usage() {
  return `restorecontract — turn Compose JSON into a recovery contract

Usage:
  restorecontract capture --compose compose.json [--out restore-contract.json]
  restorecontract report  --contract restore-contract.json [--out RESTORE.md]
  restorecontract check   --contract restore-contract.json [--root PATH] [--env-path PATH]

Safe by default:
  This tool reads files only. It never starts containers, copies data, or prints secret values.
  Produce compose.json without interpolation when possible:
  docker compose config --format json --no-interpolate > compose.json
`;
}

function parseArgs(args) {
  const options = { root: process.cwd(), json: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") {
      options.json = true;
    } else if (["--compose", "--contract", "--out", "--root", "--env-path"].includes(arg)) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value`);
      index += 1;
      options[{ "--compose": "compose", "--contract": "contract", "--out": "out", "--root": "root", "--env-path": "envPath" }[arg]] = value;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

async function readJson(path) {
  const raw = path && path !== "-" ? await readFile(path, "utf8") : await readFile(0, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON input: ${error.message}`);
  }
}

async function writeOutput(path, value) {
  if (!path) {
    process.stdout.write(value);
    return;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, value, "utf8");
  console.log(`Wrote ${path}`);
}

async function main() {
  const [command = "help", ...args] = process.argv.slice(2);
  if (["help", "--help", "-h"].includes(command)) {
    console.log(usage());
    return;
  }

  const options = parseArgs(args);
  if (command === "capture") {
    const contract = captureCompose(await readJson(options.compose));
    await writeOutput(options.out, `${JSON.stringify(contract, null, 2)}\n`);
    return;
  }

  if (command === "report") {
    if (!options.contract) throw new Error("report requires --contract PATH");
    await writeOutput(options.out, renderMarkdown(await readJson(options.contract)));
    return;
  }

  if (command === "check") {
    if (!options.contract) throw new Error("check requires --contract PATH");
    const result = await checkContract(await readJson(options.contract), {
      root: options.root,
      envFile: options.envPath,
    });
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else {
      for (const error of result.errors) console.error(`ERROR: ${error}`);
      for (const warning of result.warnings) console.log(`WARN: ${warning}`);
      if (result.ok) console.log("OK: recovery contract checks passed.");
    }
    if (!result.ok) process.exitCode = 1;
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
