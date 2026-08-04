import { afterEach, beforeEach, inject } from "vitest";

import { server } from "./tests/scripts/create-mock-github-server";
import { createMockGitRepo } from "./tests/scripts/create-mock-git-repo";
import fs from "node:fs";

beforeEach(() => {
  server.listen(9999, "0.0.0.0");
  const gitTmpDir = inject("GIT_TMP_DIR");
  fs.rmSync(gitTmpDir, { force: true, recursive: true  })
  fs.mkdirSync(gitTmpDir, { recursive: true })
  createMockGitRepo(gitTmpDir);
});

afterEach(() => {
  server.close();
  fs.rmSync(inject("GIT_TMP_DIR"), { force: true, recursive: true  })
});

declare module "vitest" {
  export interface ProvidedContext {
    GIT_TMP_DIR: string;
  }
}
