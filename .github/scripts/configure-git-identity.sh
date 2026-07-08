#!/usr/bin/env bash
set -e

: "${APP_SLUG:?APP_SLUG is required}" "${GH_TOKEN:?GH_TOKEN is required}"

# Use -w 0 to prevent base64 from breaking the header with newlines
BASIC_AUTH=$(printf "x-access-token:%s" "$GH_TOKEN" | base64 -w 0)
app_user="${APP_SLUG}[bot]"
app_id="$(gh api "/users/$app_user" --jq .id)"

# Build the keys and values
KEY_0="http.https://github.com/.extraheader"
VALUE_0="AUTHORIZATION: basic $BASIC_AUTH"
KEY_1="user.name"
VALUE_1="$app_user"
KEY_2="user.email"
VALUE_2="$app_id+$app_user@users.noreply.github.com"

# Safely construct the JSON string using jq (natively available on GH runners)
# This guarantees quotes and special characters are perfectly escaped.
GIT_ENV_JSON=$(jq -n -c \
  --arg k0 "$KEY_0" --arg v0 "$VALUE_0" \
  --arg k1 "$KEY_1" --arg v1 "$VALUE_1" \
  --arg k2 "$KEY_2" --arg v2 "$VALUE_2" \
  --arg token "$GH_TOKEN" \
  '{
    "GIT_CONFIG_COUNT": "3",
    "GIT_CONFIG_KEY_0": $k0,
    "GIT_CONFIG_VALUE_0": $v0,
    "GIT_CONFIG_KEY_1": $k1,
    "GIT_CONFIG_VALUE_1": $v1,
    "GIT_CONFIG_KEY_2": $k2,
    "GIT_CONFIG_VALUE_2": $v2,
    "GH_TOKEN": $token
  }')

# Write the securely formatted JSON string to outputs
echo "git_env_config=$GIT_ENV_JSON" >> "$GITHUB_OUTPUT"