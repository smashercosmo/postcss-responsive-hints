#!/usr/bin/env bash

if pnpm changeset status --since=main --output status.json; then
  COUNT=$(jq -r '.changesets | length' status.json)

  if [ "$COUNT" -ne 0 ]; then
    HAS_CHANGESETS=true
  else
    HAS_CHANGESETS=false
  fi
else
  # Command failed (exit code 1), meaning no changesets exist.
  HAS_CHANGESETS=false
fi

echo "has_changesets=$HAS_CHANGESETS" >> "$GITHUB_OUTPUT"
