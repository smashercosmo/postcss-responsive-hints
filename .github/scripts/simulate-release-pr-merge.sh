#!/usr/bin/env bash

git checkout main
git merge changeset-release/main --no-ff --no-edit
echo "::notice:: Branch changeset-release/main has been merged to main"