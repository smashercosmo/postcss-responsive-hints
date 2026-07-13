import type { CommitFunctions } from "@changesets/types";
import commitFunctions from "@changesets/cli/commit";
import { execSync } from "node:child_process";

const { getVersionMessage } = commitFunctions;

const functions: CommitFunctions = {
  async getAddMessage(changeset) {
    try {
      const msg = `docs(changes): ${changeset.summary}\n\nPackage: ${changeset.releases[0].name}\n\nVersion bump: ${changeset.releases[0].type}`;
      execSync(`echo "${msg}" | pnpm commitlint --verbose`, { encoding: "utf-8" });
      return msg;
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
  },
  async getVersionMessage({releases}) {
    try {
      const releasable = releases.filter(
        (release) => release.type !== "none",
      );
      const toBeReleasedText = releasable.length ? [`${releasable.length} package(s) to be released`] : [];
      const toBeVersionedText = releases.length ? [`${releases.length} package(s) to receive version and changelog updates only.`] : [];
      const summary = [...toBeReleasedText, ...toBeVersionedText].join(", ")

      const toBeReleasedLines = releasable
      .map((release) => `  ${release.name}@${release.newVersion}`)
        .join("\n");

      const toBeVersionedLines = releases
      .map((release) => `  ${release.name}@${release.newVersion}`)
      .join("\n");

      const toBeReleasedBlock = releasable.length ? [`Releases:\n\n${toBeReleasedLines}`] : [];
      const toBeVersionedBlock = releases.length ? [`Version bumps and changelog updates:\n\n${toBeVersionedLines}`] : [];

      const msg = [`docs(release): ${summary}`, ...toBeReleasedBlock, ...toBeVersionedBlock].join("\n\n");
      console.log(msg)
      execSync(`echo "${msg}" | pnpm commitlint --verbose`, { encoding: "utf-8" });
      return msg;
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
  },
};

export default functions;
