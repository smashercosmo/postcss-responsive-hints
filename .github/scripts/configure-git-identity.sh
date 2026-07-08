#!/usr/bin/env bash

: "${APP_SLUG:?APP_SLUG is required}" "${GH_TOKEN:?GH_TOKEN is required}"

BASIC_AUTH=$(printf "x-access-token:%s" "$GH_TOKEN" | base64)
app_user="$APP_SLUG[bot]"
app_id="$(gh api "/users/$app_user" --jq .id)"

# Build the keys and values
KEY_0="http.https://github.com/.extraheader"
VALUE_0="AUTHORIZATION: basic $BASIC_AUTH"
KEY_1="user.name"
VALUE_1="$app_user"
KEY_2="user.email"
VALUE_2="$app_id+$app_user@users.noreply.github.com"

# Combine into a compact JSON string
# Using printf to cleanly format without relying on external tools like jq
GIT_ENV_JSON=$(printf '{"GIT_CONFIG_COUNT":"3","GIT_CONFIG_KEY_0":"%s","GIT_CONFIG_VALUE_0":"%s","GIT_CONFIG_KEY_1":"%s","GIT_CONFIG_VALUE_1":"%s","GIT_CONFIG_KEY_2":"%s","GIT_CONFIG_VALUE_2":"%s","GH_TOKEN":"%s"}' \
  "$KEY_0" "$VALUE_0" "$KEY_1" "$VALUE_1" "$KEY_2" "$VALUE_2", "$GH_TOKEN")

# Write the single string to outputs
echo "git_env_config=$GIT_ENV_JSON" >> "$GITHUB_OUTPUT"