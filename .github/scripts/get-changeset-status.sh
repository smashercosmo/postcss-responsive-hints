#!/usr/bin/env bash

: "${HEAD_REF:?HEAD_REF is required}"

if [ "$HEAD_REF" = "changeset-release/main" ]; then
  echo '```json' >> "$GITHUB_STEP_SUMMARY"
  echo '{ "github": { "head_ref": "changeset-release/main" } }' >> "$GITHUB_STEP_SUMMARY"
  echo '```' >> "$GITHUB_STEP_SUMMARY"
else
  pnpm changeset status --since=origin/main --output status.json
  echo '```json' >> "$GITHUB_STEP_SUMMARY"
  cat status.json >> "$GITHUB_STEP_SUMMARY"
  echo '```' >> "$GITHUB_STEP_SUMMARY"
fi