#!/usr/bin/env bash

set -o errexit    # exit immediately if any command fails
set -o nounset    # error on use of undefined variables
set -o pipefail   # a pipeline fails if any command in it fails, not just the last one

MARKER_FILE=".act-mock-changeset-used"
CHANGESET_FILE=".changeset/mock-changeset.md"

# ":-" means "use the value of BRANCH_NAME if it's set and non-empty,
# otherwise fall back to whatever comes after the ":-".
BRANCH_NAME="${BRANCH_NAME:-act-mock-changesets}"
MERGE_TO_MAIN="${MERGE_TO_MAIN:-false}"

if [ -f "$MARKER_FILE" ]; then
  echo "::notice:: Mock changeset already used once, skipping"
  exit 0
fi

cat > "$CHANGESET_FILE" << EOF
---
"postcss-responsive-hints": major
---

Changes description
EOF

git checkout -B "$BRANCH_NAME"
git add "$CHANGESET_FILE"
touch "$MARKER_FILE"
git add "$MARKER_FILE"
git commit -m "docs(changeset): Changes description"

if [ "$MERGE_TO_MAIN" = "true" ]; then
  git checkout main
  git merge "$BRANCH_NAME" --no-ff --no-edit
  echo "::notice:: Mock changeset merged into main"
else
  echo "::notice:: Mock changeset created on branch $BRANCH_NAME"
fi
