#!/usr/bin/env bash

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

{
  echo "GIT_CONFIG_COUNT=3"

  echo "GIT_CONFIG_KEY_0=http.https://github.com/.extraheader"
  echo "GIT_CONFIG_VALUE_0<<EOF_VALUE_0"
  echo "AUTHORIZATION: basic $BASIC_AUTH"
  echo "EOF_VALUE_0"

  echo "GIT_CONFIG_KEY_1=user.name"
  echo "GIT_CONFIG_VALUE_1<<EOF_VALUE_1"
  echo "$app_user"
  echo "EOF_VALUE_1"

  echo "GIT_CONFIG_KEY_2=user.email"
  echo "GIT_CONFIG_VALUE_2<<EOF_VALUE_2"
  echo "$app_id+$app_user@users.noreply.github.com"
  echo "EOF_VALUE_2"

  echo "GH_TOKEN=$GH_TOKEN"
} >> "$GITHUB_ENV"