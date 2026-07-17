import type { CommitFunctions } from "@changesets/types";
import { execSync } from "node:child_process";
import path from 'node:path'
import fs from 'node:fs'
import { EOL } from 'node:os'

const rootNodeModulesDirectory = execSync("pnpm root", { encoding: "utf-8" });
const rootProjectDirectory = path.resolve(rootNodeModulesDirectory, "..");

function envFileToJson(envFilePath: string) {
  const envFileBody = fs.readFileSync(envFilePath, "utf8");
  return Object.fromEntries(
    envFileBody
    .split(new RegExp(EOL))
    .filter(Boolean)
    .map((pair) => pair.split("=")),
  ) as Record<string, string>;
}

const envFilePath = path.resolve(rootProjectDirectory, ".env");
const envJsonObject = envFileToJson(envFilePath);

function lintCommitMessage(message: string) {
  try {
    execSync(
      `echo "${message}" | pnpm commitlint --verbose --extends @postcss-responsive-hints/commitlint --extends ${rootProjectDirectory}/.changeset/.commitlintrc.json`,
      { encoding: "utf-8" },
    );
  } catch (error) {
    const msg =
      typeof error === "object" &&
      error !== null &&
      "stdout" in error &&
      typeof error.stdout === "string"
        ? error.stdout
        : "commit failed";
    console.error("\nCommitlint error:\n");
    console.error(msg);
    process.exit(1);
  }
}

function getPrivatePackagesSet() {
  const packages: { name: string; private?: boolean }[] = JSON.parse(
    execSync("pnpm list --recursive --depth -1 --json", { encoding: "utf-8" }),
  );
  return new Set(packages.filter(({ private: internal }) => internal).map(({ name }) => name));
}

const functions: CommitFunctions = {
  async getAddMessage(changeset) {
    const message = `${envJsonObject.CHANGESET_ADD_COMMIT_MESSAGE_PREFIX}: ${changeset.summary}\n\nPackage: ${changeset.releases[0].name}\n\nVersion bump: ${changeset.releases[0].type}`;
    lintCommitMessage(message);
    return message;
  },
  async getVersionMessage({ releases }) {
    const privatePackagesSet = getPrivatePackagesSet();
    const changed = releases.filter((release) => release.type !== "none");
    const versioned = changed.filter((release) => privatePackagesSet.has(release.name));
    const releasable = changed.filter((release) => !privatePackagesSet.has(release.name));
    const toBeReleasedText = releasable.length
      ? [`${releasable.length} package(s) to be released`]
      : [];
    const toBeVersionedText = versioned.length
      ? [`${versioned.length} package(s) to receive version and changelog updates only`]
      : [];
    const summary = [...toBeReleasedText, ...toBeVersionedText].join(", ");

    const toBeReleasedLines = releasable
      .map((release) => `  ${release.name}@${release.newVersion}`)
      .join("\n");

    const toBeVersionedLines = versioned
      .map((release) => `  ${release.name}@${release.newVersion}`)
      .join("\n");

    const toBeReleasedBlock = releasable.length ? [`Releases:\n\n${toBeReleasedLines}`] : [];
    const toBeVersionedBlock = versioned.length
      ? [`Version bumps and changelog updates:\n\n${toBeVersionedLines}`]
      : [];

    const message = [`${envJsonObject.CHANGESET_VERSION_COMMIT_MESSAGE_PREFIX}: ${summary}`, ...toBeReleasedBlock, ...toBeVersionedBlock].join(
      "\n\n",
    );
    lintCommitMessage(message);
    return message;
  },
};

export default functions;
