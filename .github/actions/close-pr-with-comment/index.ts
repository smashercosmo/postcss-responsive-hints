import { getInput, debug,  setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";

try {
  const octokit = getOctokit(getInput("token", { required: true }));
  const comment = getInput("comment", { required: true });
  const number = Number.parseInt(
    getInput("pull-request-number", { required: true }),
    10,
  );

  const createCommentResult  = await octokit.rest.issues.createComment({
    body: comment,
    issue_number: number,
    owner: context.repo.owner,
    repo: context.repo.repo,
  });

  debug(`Comment added to the PR #${number}: ${createCommentResult.data.body}`);

  const result = await octokit.rest.pulls.update({
    owner: context.repo.owner,
    pull_number: number,
    repo: context.repo.repo,
    state: "closed",
  });

  debug(`PR #${result.data?.number} has been ${result.data.state}.`);
  setFailed("It is forbidden to create release PRs manually. Release process should be handled by the release bot.");
} catch (error) {
  if (error instanceof Error) {
    setFailed(error.message);
  }
}
