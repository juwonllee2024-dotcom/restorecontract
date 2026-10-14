import { access, readFile } from "node:fs/promises";

for (const file of ["package.json", "src/core.js", "src/cli.js", "README.md", "LICENSE"]) {
  await access(file);
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
if (packageJson.name !== "restorecontract") throw new Error("package name mismatch");
if (!packageJson.bin?.restorecontract) throw new Error("CLI entry point missing");
console.log(`Build check passed for ${packageJson.name}@${packageJson.version}.`);
