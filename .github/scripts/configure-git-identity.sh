#!/usr/bin/env bash

: "${APP_SLUG:?APP_SLUG is required}" "${GH_TOKEN:?GH_TOKEN is required}"

# Strip any embedded newlines: GNU `base64` line-wraps at 76 chars by
# default, which would silently break the HTTP header value for longer
# tokens (fine-grained PATs, etc). `tr -d '\n'` is portable across
# GNU/BSD base64 implementations, unlike the GNU-only `-w0` flag.
BASIC_AUTH=$(printf "x-access-token:%s" "$GH_TOKEN" | base64 | tr -d '\n')

app_user="${APP_SLUG}[bot]"
app_id="$(gh api "/users/$app_user" --jq .id)"

# Build the keys and values
KEY_0="http.https://github.com/.extraheader"
VALUE_0="AUTHORIZATION: basic $BASIC_AUTH"
KEY_1="user.name"
VALUE_1="$app_user"
KEY_2="user.email"
VALUE_2="$app_id+$app_user@users.noreply.github.com"

# Build the JSON with jq instead of printf/string interpolation, so
# values are properly escaped (no risk of stray characters or injection
# if any value ever contains a quote, backslash, etc).
GIT_ENV_JSON=$(jq -nc \
  --arg key0 "$KEY_0" --arg val0 "$VALUE_0" \
  --arg key1 "$KEY_1" --arg val1 "$VALUE_1" \
  --arg key2 "$KEY_2" --arg val2 "$VALUE_2" \
  --arg token "$GH_TOKEN" \
  '{
    GIT_CONFIG_COUNT:  "3",
    GIT_CONFIG_KEY_0:   $key0,
    GIT_CONFIG_VALUE_0: $val0,
    GIT_CONFIG_KEY_1:   $key1,
    GIT_CONFIG_VALUE_1: $val1,
    GIT_CONFIG_KEY_2:   $key2,
    GIT_CONFIG_VALUE_2: $val2,
    GH_TOKEN:           $token
  }')

# Write the single string to outputs
echo "git_env_config=$GIT_ENV_JSON" >> "$GITHUB_OUTPUT"