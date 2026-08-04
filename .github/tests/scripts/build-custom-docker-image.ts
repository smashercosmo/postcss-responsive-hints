import child_process from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { CUSTOM_ACT_IMAGE } from "../constants";

const SCRIPTS_DIR = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * Walk up from the script's own location until we find the Dockerfile
 */
function findDockerfileDir(startDir: string) {
  let searchDir = startDir;
  while (!fs.existsSync(path.join(searchDir, "Dockerfile")) && searchDir !== "/") {
    const parent = path.dirname(searchDir);

    /** safety net against infinite loop */
    if (parent === searchDir) {
      break;
    }

    searchDir = parent;
  }

  return fs.existsSync(path.join(searchDir, "Dockerfile")) ? searchDir : null;
}

function sha256File(path: string) {
  const data = fs.readFileSync(path);
  return crypto.createHash("sha256").update(data).digest("hex");
}

function dockerImageExists(image: string) {
  const result = child_process.spawnSync("docker", ["image", "inspect", image], {
      /**
       * `docker image inspect` outputs quite a lot of logs.
       *  We don't need this extra noise.
       */
      stdio: "ignore",
  });
  return result.status === 0;
}

export function buildCustomDockerImage() {
  const dockerfileDir = findDockerfileDir(SCRIPTS_DIR);
  if (!dockerfileDir) {
    console.error(`Could not locate Dockerfile above ${SCRIPTS_DIR}`);
    process.exit(1);
  }

  const dockerfile = path.join(dockerfileDir, "Dockerfile");
  const image = `${CUSTOM_ACT_IMAGE}:latest`;
  const hashFile = path.join(dockerfileDir, ".docker-image.hash");
  const currentHash = sha256File(dockerfile);

  const upToDate =
    dockerImageExists(image) &&
    fs.existsSync(hashFile) &&
    fs.readFileSync(hashFile, "utf8").trim() === currentHash;

  if (upToDate) {
    console.info(`✓ ${image} is up to date, skipping build`);
  } else {
    console.info(`Building ${image}...`);
    child_process.execSync(`docker build -t ${image} -f ${dockerfile} ${dockerfileDir}`, {
      stdio: "inherit",
    });
    fs.writeFileSync(hashFile, currentHash);
  }
}
