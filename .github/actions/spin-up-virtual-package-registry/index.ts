import { setOutput, info, setFailed } from "@actions/core";
import { spawn } from "node:child_process";
import path from "node:path";
import url from "node:url";

const PORT = 4833;

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export function runRegistry() {
  return Promise.race([
    new Promise<number | undefined>((resolve, reject) => {
      const child = spawn(
        "pnpm",
        [
          "--filter",
          "@root/github",
          "exec",
          "verdaccio",
          "--config",
          path.join(__dirname, "verdaccio.config.yml"),
          "--listen",
          `${PORT}`,
        ],
        {
          detached: true,
          stdio: ["ignore", "ignore", "ignore", "ipc"],
        },
      );

      child.on("message", (msg: { verdaccio_started: boolean }) => {
        if (msg.verdaccio_started) {
          child.disconnect();
          child.unref();
          resolve(child?.pid);
        }
      });

      child.on("error", error => reject(error));
      child.on("exit", () => {
        reject(new Error(`Verdaccio exited before starting.`));
      });
    }),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Verdaccio did not start within 30s")),
        30_000,
      ),
    ),
  ]);
}

try {
  const pid = await runRegistry();
  info(`Verdaccio server started on port ${PORT}`);
  setOutput("registry-server-process-pid", pid);
  setOutput("registry-server-url", `http://localhost:${PORT}`);
} catch (error) {
  if (error instanceof Error) {
    setFailed(error.message);
  }
}
