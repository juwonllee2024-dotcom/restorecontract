import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  captureCompose,
  checkContract,
  renderMarkdown,
} from "../src/core.js";

const compose = {
  version: "3.9",
  services: {
    web: {
      image: "ghcr.io/example/web:1.2.3",
      depends_on: ["db"],
      environment: {
        APP_SECRET: "super-secret",
        TZ: "UTC",
      },
      ports: ["8080:8080"],
      volumes: ["./data:/var/lib/web:ro"],
    },
    db: {
      image: "postgres:16",
      environment: ["POSTGRES_PASSWORD=another-secret"],
      volumes: ["database:/var/lib/postgresql/data"],
    },
  },
  volumes: { database: {} },
};

test("captures a deterministic recovery contract without secret values", () => {
  const contract = captureCompose(compose);

  assert.deepEqual(contract.services.map((service) => service.name), ["db", "web"]);
  assert.deepEqual(contract.services[1].dependsOn, ["db"]);
  assert.deepEqual(contract.services[1].envKeys, ["APP_SECRET", "TZ"]);
  assert.equal(contract.services[1].mounts[0].type, "bind");
  assert.equal(contract.services[0].mounts[0].type, "named");
  assert.doesNotMatch(JSON.stringify(contract), /super-secret|another-secret/);
});

test("renders a human-readable restore checklist", () => {
  const markdown = renderMarkdown(captureCompose(compose));

  assert.match(markdown, /# Restore Contract/);
  assert.match(markdown, /database/);
  assert.match(markdown, /APP_SECRET/);
  assert.match(markdown, /logical dump/i);
  assert.match(markdown, /\.\/data/);
});

test("checks bind mounts and env names without exposing values", async () => {
  const root = await mkdtemp(join(tmpdir(), "restorecontract-"));
  try {
    const contract = captureCompose(compose);
    const before = await checkContract(contract, { root, envFile: ".env" });
    assert.equal(before.ok, false);
    assert.match(before.errors.join("\n"), /missing bind mount/i);
    assert.match(before.errors.join("\n"), /APP_SECRET/);
    assert.doesNotMatch(before.errors.join("\n"), /super-secret|another-secret/);

    await mkdir(join(root, "data"), { recursive: true });
    await writeFile(join(root, ".env"), "APP_SECRET=super-secret\nTZ=UTC\nPOSTGRES_PASSWORD=another-secret\n", "utf8");
    const after = await checkContract(contract, { root, envFile: ".env" });
    assert.equal(after.ok, true);
    assert.deepEqual(after.errors, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects input without a services object", () => {
  assert.throws(() => captureCompose({}), /services/i);
});
