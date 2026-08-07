#!/usr/bin/env bash

if ! change_status_output=$(pnpm change status 2>&1); then
  echo "::error::$change_status_output"
  exit 1
fi

echo "$change_status_output"

if echo "$change_status_output" | tr '[:upper:]' '[:lower:]' | grep -q "no pending changes"; then
  has_pending_changes=false
else
  has_pending_changes=true
fi

echo "has-pending-changes=$has_pending_changes" >> "$GITHUB_OUTPUT"