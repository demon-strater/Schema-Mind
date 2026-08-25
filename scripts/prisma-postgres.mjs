import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const source = await readFile("prisma/schema.prisma", "utf8");
if (!source.includes('provider = "sqlite"')) throw new Error("Expected the canonical SQLite provider declaration");
const target = "prisma/.generated-postgres.prisma";
await writeFile(target, source.replace('provider = "sqlite"', 'provider = "postgresql"'), "utf8");
for (const args of [["generate", "--schema", target], ["db", "push", "--schema", target, "--skip-generate"]]) {
  const result = spawnSync("node_modules/.bin/prisma.cmd", args, { stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
