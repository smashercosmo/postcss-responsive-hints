#!/usr/bin/env bash

set -o errexit    # exit immediately if any command fails
set -o nounset    # error on use of undefined variables
set -o pipefail   # a pipeline fails if any command in it fails, not just the last one

# 1. Configure Git identity for tagging
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# 2. Let changesets generate local tags for the new versions
pnpm changeset tag

# 3. Push the new tags to the remote
git push origin --tags

# 4. Create a GitHub Release for each new tag
# git tag --points-at HEAD ensures we only release tags created in this run
NEW_TAGS=$(git tag --points-at HEAD)

for TAG in $NEW_TAGS; do
  echo "::notice:: Creating GitHub Release for $TAG..."
  # --generate-notes automatically builds the release body from merged PRs
  gh release create "$TAG" --title "$TAG" --generate-notes
done