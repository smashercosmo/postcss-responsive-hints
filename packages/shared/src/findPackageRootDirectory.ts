import fs from "node:fs";
import path from "node:path";

export function findPackageRootDirectory(startDir: string) {
  let currentDir = path.resolve(startDir);

  while (true) {
    // Check if the current directory contains a package.json
    if (fs.existsSync(path.join(currentDir, "package.json"))) {
      return currentDir;
    }

    // Move up one level
    const parentDir = path.dirname(currentDir);

    // Stop if we've reached the system root (no package.json found)
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  throw new Error(`Cannot find package root directory: ${currentDir}`);
}
