#!/usr/bin/env bash

set -o errexit    # exit immediately if any command fails
set -o nounset    # error on use of undefined variables
set -o pipefail   # a pipeline fails if any command in it fails, not just the last one

pnpm changeset status --since=origin/main --output status.json
echo "## Changeset Status" >> "$GITHUB_STEP_SUMMARY"
echo '```json' >> "$GITHUB_STEP_SUMMARY"
cat status.json >> "$GITHUB_STEP_SUMMARY"
echo '```' >> "$GITHUB_STEP_SUMMARY"