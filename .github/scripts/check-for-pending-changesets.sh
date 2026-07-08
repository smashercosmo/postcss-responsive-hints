#!/usr/bin/env bash

if [ -d ".changeset" ] && [ -n "$(find .changeset -maxdepth 1 -name '*.md' ! -name 'README.md' -print -quit)" ]; then
  echo "has_changesets=true" >> "$GITHUB_OUTPUT"
else
  echo "has_changesets=false" >> "$GITHUB_OUTPUT"
fi