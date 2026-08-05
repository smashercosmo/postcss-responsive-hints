import process from "node:process";
import child_process from "node:child_process";
import fs from "node:fs";
import os from "node:os";

let output: string;
let hasChangesets: boolean;

try {
  output = child_process.execSync("pnpm change status", { encoding: "utf8" });
  hasChangesets = !output.toLowerCase().includes("no pending changes");
} catch {
  output = "";
  hasChangesets = false;
}

const githubOutput = process.env.GITHUB_OUTPUT;

if (!githubOutput) {
  console.error("Missing GITHUB_OUTPUT env var.");
  process.exit(1);
}

fs.appendFileSync(githubOutput, `has_changesets=${hasChangesets}\n`);
fs.appendFileSync(githubOutput, `changesets_output=${output.replaceAll(os.EOL, " ")}\n`);
