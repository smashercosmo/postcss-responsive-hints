import { afterEach, beforeEach, inject } from "vitest";

import { createMockGitRepo } from "./tests/scripts/create-mock-git-repo";
import fs from "node:fs";

beforeEach(() => {
  const gitTmpDir = inject("GIT_TMP_DIR");
  fs.rmSync(gitTmpDir, { force: true, recursive: true  })
  fs.mkdirSync(gitTmpDir, { recursive: true })
  createMockGitRepo(gitTmpDir);
});

afterEach(() => {
  fs.rmSync(inject("GIT_TMP_DIR"), { force: true, recursive: true  })
});

declare module "vitest" {
  export interface ProvidedContext {
    GIT_TMP_DIR: string;
  }
}
