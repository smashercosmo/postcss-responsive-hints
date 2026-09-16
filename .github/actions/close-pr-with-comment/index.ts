import { getInput, info, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";

try {
  const octokit = getOctokit(getInput("token", { required: true }));
  const comment = getInput("comment", { required: true });
  const number = Number.parseInt(
    getInput("pull-request-number", { required: true }),
    10,
  );

  await octokit.rest.issues.createComment({
    body: comment,
    issue_number: number,
    owner: context.repo.owner,
    repo: context.repo.repo,
  });

  const result = await octokit.rest.pulls.update({
    owner: context.repo.owner,
    pull_number: number,
    repo: context.repo.repo,
    state: "closed",
  });
  info(`PR #${result.data?.number} is ${result.data.state}`);
} catch (error) {
  if (error instanceof Error) {
    setFailed(error.message);
  }
}
