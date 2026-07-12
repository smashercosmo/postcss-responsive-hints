#!/usr/bin/env bash
set -euo pipefail

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

act --reuse -j version-and-pack

CONTAINER_ID=$(docker ps -a --filter "name=act-Release-version-and-pack" --format "{{.ID}}" | head -1)
WORKING_DIR=$(docker inspect "$CONTAINER_ID" --format '{{ .Config.WorkingDir }}')

docker cp "$CONTAINER_ID":"$WORKING_DIR"/. "$WORKDIR"

act -j version-and-pack --directory "$WORKDIR"