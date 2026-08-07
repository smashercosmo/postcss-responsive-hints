import { getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { type PullRequestEvent } from "@octokit/webhooks-types";

function isPullRequestEvent(payload: object): payload is PullRequestEvent {
  return "eventName" in payload && payload.eventName === "pull_request";
}

if (!isPullRequestEvent(context.payload)) {
  throw new Error("This action must be triggered by a pull_request event.");
}

const octokit = getOctokit(getInput("token", { required: true }));
const head = context.payload.pull_request.head.ref;
const sender = context.payload.sender.type;
const number = context.payload.pull_request.number;

if (
  getInput("release-branch-name", { required: true }) === head &&
  sender === "User"
) {
  await octokit.rest.issues.createComment({
    body: `⚠️ **Notice:** Release PRs from \`${head}\` cannot be created manually. Please let the automated release workflow handle this. Closing this PR.`,
    issue_number: number,
    owner: context.repo.owner,
    repo: context.repo.repo,
  });

  await octokit.rest.pulls.update({
    owner: context.repo.owner,
    pull_number: number,
    repo: context.repo.repo,
    state: "closed",
  });

  setFailed(
    `User ${context.payload.sender.login} tried to manually open a release PR from ${head}.`,
  );
}