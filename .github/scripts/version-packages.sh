#!/usr/bin/env bash

set -o errexit    # exit immediately if any command fails
set -o nounset    # error on use of undefined variables
set -o pipefail   # a pipeline fails if any command in it fails, not just the last one

# 1. Switch to the release branch
git checkout -B changeset-release/main

# 2. Consume changesets and update package.json(s)
pnpm changeset version

# 3. Update the lockfile to reflect the new package.json versions
pnpm ci

# 4. Stage all changes (including deleted changeset files)
git add -A

# 5. Commit only if there are actual changes
git diff --staged --quiet || git commit -m "chore: version packages"