#!/usr/bin/env bash

if ! change_status_output=$(pnpm change status 2>&1); then
  echo "::error::$change_status_output"
  exit 1
fi

if echo "$change_status_output" | tr '[:upper:]' '[:lower:]' | grep -q "no pending changes"; then
  has_pending_change_files=false
else
  has_pending_change_files=true
fi

echo "has-pending-change-files=$has_pending_change_files" >> "$GITHUB_OUTPUT"