#!/usr/bin/env bash

# 1. Let changesets generate local tags for the new versions
pnpm changeset tag

# 2. Push the new tags to the remote
git push origin --tags

# 3. Create a GitHub Release for each new tag
# git tag --points-at HEAD ensures we only release tags created in this run
NEW_TAGS=$(git tag --points-at HEAD)

for TAG in $NEW_TAGS; do
  echo "::notice:: Creating GitHub Release for $TAG..."
  # --generate-notes automatically builds the release body from merged PRs
  gh release create "$TAG" --title "$TAG" --generate-notes
done