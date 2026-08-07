import { fork } from "node:child_process";
import url from "node:url";

const bin = url.fileURLToPath(import.meta.resolve("verdaccio/bin/verdaccio"));

const child = fork(
  bin,
  ["--config", "./.verdaccio/config.yaml", "--listen", "4873"],
  {
    detached: true,
    stdio: "inherit",
  },
);

child.on("message", (msg: unknown) => {
  if (
    typeof msg === "object" &&
    msg !== null &&
    "verdaccio_started" in msg &&
    msg.verdaccio_started
  ) {
    console.info("Verdaccio server is up and running.");
    process.exit(0);
  }
});

child.on("error", err => {
  console.error(err.message);
  process.exit(1);
});
