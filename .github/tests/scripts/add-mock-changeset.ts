import process from "node:process";
import child_process from "node:child_process";
import path from "node:path";

const BRANCH_NAME = process.env.BRANCH_NAME;
const CHANGESET_DESCRIPTION = process.env.CHANGESET_DESCRIPTION;

if (!BRANCH_NAME) {
  console.error("Missing required env var: BRANCH_NAME");
  process.exit(1);
}

if (!CHANGESET_DESCRIPTION) {
  console.error("Missing required env var: CHANGESET_DESCRIPTION");
  process.exit(1);
}

function run(command: string) {
  return child_process.execSync(command, { encoding: "utf8" });
}

// 1. Find git root
const root = run("git rev-parse --show-toplevel")

// 2. Generate pending change file
run(`pnpm change postcss-responsive-hints --bump major --summary "${CHANGESET_DESCRIPTION}"`);

// 3. Let's create git worktree as I don't want to change branches
const worktree = path.join(root, "../tmp-worktree");
run(`git worktree add -B ${BRANCH_NAME} ${worktree}`);

// 4. Move to the worktree directory
run(`cd ${worktree}`);

// 5. Add generated pending change file
run(`git add .`);

// 6. Commit generated file
const changeStatus = run("pnpm change status");
const commitMessage = `docs: add pending change intents\n\n${changeStatus}`;
run(`git commit -m "${commitMessage}"`);

// 6. Go back to main repo
run(`cd ${root}`);

// 7. Remove temporary worktree
run(`git worktree remove ${worktree}`);
