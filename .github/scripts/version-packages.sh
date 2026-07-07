#!/usr/bin/env bash

set -o errexit    # exit immediately if any command fails
set -o nounset    # error on use of undefined variables
set -o pipefail   # a pipeline fails if any command in it fails, not just the last one

# 1. Configure git first
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# 2. Switch to the release branch
git checkout -B changeset-release/main

# 3. Consume changesets and update package.json(s)
pnpm changeset version

# 4. Update the lockfile to reflect the new package.json versions
pnpm ci

# 5. Stage all changes (including deleted changeset files)
git add -A

# 6. Commit only if there are actual changes
git diff --staged --quiet || git commit -m "chore: version packages"