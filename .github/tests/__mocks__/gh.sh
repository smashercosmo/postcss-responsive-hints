#!/usr/bin/env bash

# Mocked gh CLI for local act runs — only handles what our workflows need
case "$1 $2" in
  "api /users/"*)
    echo '{"id": 12345, "login": "mocked-app[bot]"}'
    ;;
  *)
    echo "gh mock: unhandled command: $*" >&2
    exit 1
    ;;
esac