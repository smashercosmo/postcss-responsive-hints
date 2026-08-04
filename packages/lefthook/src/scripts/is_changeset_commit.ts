#!/usr/bin/env node

import { constants, getProcessArgvAsObject } from "@root/shared";
import fs from "node:fs";
import process from "node:process";

const args = getProcessArgvAsObject(process.argv, [
  "commit_edit_msg_path",
] as const);
const { commit_edit_msg_path } = args;

process.stdout.write("commit_edit_msg_path");
process.stdout.write(commit_edit_msg_path);

if (commit_edit_msg_path && !fs.existsSync(commit_edit_msg_path)) {
  console.error(
    `is_changeset_commit: COMMIT_EDITMSG file not found: ${commit_edit_msg_path}`,
  );
  process.exit(2);
}

const firstLine =
  fs.readFileSync(commit_edit_msg_path, "utf8").split("\n")[0] || "";
const {
  CHANGESET_ADD_COMMIT_MESSAGE_PREFIX,
  CHANGESET_VERSION_COMMIT_MESSAGE_PREFIX,
} = constants;

const matches =
  (CHANGESET_ADD_COMMIT_MESSAGE_PREFIX &&
    firstLine.startsWith(CHANGESET_ADD_COMMIT_MESSAGE_PREFIX)) ||
  (CHANGESET_VERSION_COMMIT_MESSAGE_PREFIX &&
    firstLine.startsWith(CHANGESET_VERSION_COMMIT_MESSAGE_PREFIX));

process.exit(matches ? 0 : 1);
