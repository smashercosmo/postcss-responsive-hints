#!/usr/bin/env bash

git push origin "$RELEASE_BRANCH_NAME" --force

# Check if an open PR already exists for this branch
PR_NUMBER=$(gh pr list --head "$RELEASE_BRANCH_NAME" --base main --state open --json number --jq '.[0].number')
PR_TITLE="chore: version packages"
PR_BODY="This PR was opened by the release workflow. Merging it will publish the packages."

if [ -z "$PR_NUMBER" ]; then
  echo "::notice:: No open PR found. Creating a new one..."
  gh pr create --base main --head "$RELEASE_BRANCH_NAME" \
    --title "$PR_TITLE" \
    --body "$PR_BODY"
else
  echo "::notice:: Updating existing PR #$PR_NUMBER..."
  gh pr edit $PR_NUMBER --title "$PR_TITLE" --body "$PR_BODY"
fi