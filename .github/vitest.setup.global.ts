import "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { type TestProject } from "vitest/node";

import { buildCustomDockerImage } from "./tests/scripts/build-custom-docker-image";
import { server } from "./tests/scripts/create-mock-github-server.ts";

export default function setup({ provide }: TestProject) {
  buildCustomDockerImage();
  server.listen(9999, "0.0.0.0");
  const gitTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "act-monorepo-"));
  provide("GIT_TMP_DIR", gitTmpDir);

  function handleSigTerm() {
    console.warn('SIGTERM signal received: closing HTTP server and removing tmp directory');
    server.close(() => console.info('HTTP server closed'))
    fs.rmSync(gitTmpDir, { force: true, recursive: true });
  }

  process.once('SIGTERM', handleSigTerm);
  process.once('SIGINT', handleSigTerm);

  return function teardown() {
    server.close();
    fs.rmSync(gitTmpDir, { force: true, recursive: true });

    process.off('SIGTERM', handleSigTerm);
    process.off('SIGINT', handleSigTerm);
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    GIT_TMP_DIR: string;
  }
}
