import "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { type TestProject } from "vitest/node";

import { buildCustomDockerImage } from "./tests/scripts/build-custom-docker-image";

export default function setup({ provide }: TestProject) {
  buildCustomDockerImage();
  const gitTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "act-monorepo-"));
  provide("GIT_TMP_DIR", gitTmpDir);

  return function teardown() {
    fs.rmSync(gitTmpDir, { force: true, recursive: true });
  }
}

declare module "vitest" {
  export interface ProvidedContext {
    GIT_TMP_DIR: string;
  }
}
