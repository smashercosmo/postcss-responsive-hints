#!/usr/bin/env bash

set -o errexit    # exit immediately if any command fails
set -o nounset    # error on use of undefined variables
set -o pipefail   # a pipeline fails if any command in it fails, not just the last one

if [ -d ".changeset" ] && [ -n "$(find .changeset -maxdepth 1 -name '*.md' ! -name 'README.md' -print -quit)" ]; then
  echo "has_changesets=true" >> "$GITHUB_OUTPUT"
else
  echo "has_changesets=false" >> "$GITHUB_OUTPUT"
fi