#!/usr/bin/env bash

: "${APP_SLUG:?APP_SLUG is required}" "${TOKEN:?TOKEN is required}" "${REPO:?REPO is required}"

git config --global user.name "${APP_SLUG}[bot]"
git config --global user.email "${APP_SLUG}[bot]@users.noreply.github.com"
git remote set-url origin "https://x-access-token:${TOKEN}@github.com/${REPO}"