import { getInput, notice, info, setFailed } from "@actions/core";
import { getOctokit, context } from "@actions/github";

const token = getInput("token", { required: true });
const head = getInput("release-branch", { required: true });

const octokit = getOctokit(token);
const { owner, repo } = context.repo;

const base = "main";
const title = "chore: version packages";
const body =
  "This PR was opened by the release workflow. Merging it will publish the packages.";

try {
  const { data: existingPRs } = await octokit.rest.pulls.list({
    base,
    head: `${owner}:${head}`,
    owner,
    repo,
    state: "open",
  });

  if (existingPRs.length === 0) {
    notice("No open PR found. Creating a new one...");
    const { data: newPR } = await octokit.rest.pulls.create({
      base,
      body,
      head,
      owner,
      repo,
      title,
    });
    info(`Created pull request #${newPR.number}`);
  } else {
    const pr_number = existingPRs[0].number;
    notice(`Updating existing PR #${pr_number}...`);
    await octokit.rest.pulls.update({
      body,
      owner,
      pull_number: pr_number,
      repo,
      title,
    });
    info(`Updated pull request #${pr_number}`);
  }
} catch (error) {
  if (error instanceof Error) {
    setFailed(`Failed to create or update release PR: ${error.message}`);
  } else {
    setFailed("An unexpected error occurred.");
  }
}
