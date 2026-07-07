#!/usr/bin/env bash

set -o errexit    # exit immediately if any command fails
set -o nounset    # error on use of undefined variables
set -o pipefail   # a pipeline fails if any command in it fails, not just the last one

git checkout main
git merge changeset-release/main --no-ff --no-edit
echo "::notice:: Branch changeset-release/main has been merged to main"