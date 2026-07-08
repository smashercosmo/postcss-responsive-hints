#!/usr/bin/env bash

: "${APP_SLUG:?APP_SLUG is required}" "${TOKEN:?TOKEN is required}"

BASIC_AUTH=$(printf "x-access-token:%s" "$GITHUB_TOKEN" | base64)
app_user="$APP_SLUG[bot]"
app_id="$(gh api "/users/$app_user" --jq .id)"

export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0="http.https://github.com/.extraheader"
export GIT_CONFIG_VALUE_0="AUTHORIZATION: basic $BASIC_AUTH"
export GIT_CONFIG_KEY_1="user.name"
export GIT_CONFIG_VALUE_1="$app_user"
export GIT_CONFIG_KEY_2="user.email"
export GIT_CONFIG_VALUE_2="$app_id+$app_user@users.noreply.github.com"