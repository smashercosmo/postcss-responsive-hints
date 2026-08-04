import process from "node:process";
import child_process from "node:child_process";
import fs from "node:fs";

let output: string;
let hasChangesets: boolean;

try {
  output = child_process.execSync("pnpm change status", { encoding: "utf8" });
  hasChangesets = !output.toLowerCase().includes("no pending changes");
} catch {
  // Command failed, meaning no changesets exist (or an error occurred).
  hasChangesets = false;
}

const githubOutput = process.env.GITHUB_OUTPUT;

if (!githubOutput) {
  console.error("Missing GITHUB_OUTPUT env var.");
  process.exit(1);
}

fs.appendFileSync(githubOutput, `has_changesets=${hasChangesets}\n`);
