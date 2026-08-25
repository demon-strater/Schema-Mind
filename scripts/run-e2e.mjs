import { spawn, spawnSync } from "node:child_process";

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--turbopack", "--port", "3100"], { stdio: "inherit" });
async function ready() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { const response = await fetch("http://127.0.0.1:3100"); if (response.ok) return; } catch { /* server is starting */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("E2E server did not become ready");
}
function stop() {
  if (!server.pid) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  else server.kill("SIGTERM");
}
let exitCode = 1;
try {
  await ready();
  const runner = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test"], { stdio: "inherit" });
  exitCode = await new Promise((resolve) => runner.on("exit", (code) => resolve(code ?? 1)));
} finally { stop(); }
process.exit(exitCode);
