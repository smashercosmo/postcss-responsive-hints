#!/usr/bin/env bash

# Install jq to parse package configurations safely
# --yes tells the package manager to automatically answer "yes" to any confirmation prompts
apt-get update && apt-get install --yes jq

# Find target node engine from package.json:
# 1. devEngines.runtime.version
# 2. engines.node (fallback)
TARGET_NODE_VERSION="null"

# `-f` — file exists and is a regular file
# `-z` — string has zero length
# `//` — the "alternative operator", jq equivalent of a fallback/default operator (similar to || in bash or JS
# `empty` — special jq value that produces no output at all — not the string "null", not an empty string "", just nothing
if [ -f "package.json" ]; then
  TARGET_NODE_VERSION=$(jq --raw-output '.devEngines.runtime.version // empty' package.json)

  if [ -z "$TARGET_NODE_VERSION" ] || [ "$TARGET_NODE_VERSION" = "null" ]; then
    TARGET_NODE_VERSION=$(jq --raw-output '.engines.node // empty' package.json)
  fi
fi

# Strip version range characters (^ > = < ~ and spaces)
TARGET_NODE_VERSION=$(echo "$TARGET_NODE_VERSION" | tr --delete '^>=<~ ')

echo "::notice:: Found target Node version: $TARGET_NODE_VERSION"

if [ "$TARGET_NODE_VERSION" = "null" ] || [ -z "$TARGET_NODE_VERSION" ]; then
  echo "::warning:: No node engine specified. Defaulting to LTS."
  TARGET_NODE_VERSION="lts"
fi

echo "::notice:: Found target Node version: $TARGET_NODE_VERSION"

# Install 'n' and upgrade Node directly as root inside Docker
pnpm install -g n

set +o nounset
set +o errexit
set +o pipefail
n $TARGET_NODE_VERSION
set -o nounset
set -o errexit
set -o pipefail

# Clear the Linux command path cache so the new version is tracked immediately
hash -r
echo "::notice:: Upgraded local act container Node runtime to:"
node -v