#!/usr/bin/env bash

# Helper: extract the value following a given flag (e.g. --jq, --title)
extract_flag_value() {
  local flag="$1"
  shift
  local args=("$@")
  for i in "${!args[@]}"; do
    if [[ "${args[$i]}" == "$flag" ]]; then
      echo "${args[$((i+1))]}"
      return 0
    fi
  done
  return 1
}

case "$1 $2" in
  "api /users/"*)
    echo '{"id": 12345, "login": "mocked-app[bot]"}'
    ;;

  "pr list")
    RESULT='[{"number": 42}]'
    if JQ_FILTER=$(extract_flag_value "--jq" "$@"); then
      echo "$RESULT" | jq -r "$JQ_FILTER"
    else
      echo "$RESULT"
    fi
    ;;

  "pr create")
    TITLE=$(extract_flag_value "--title" "$@")
    echo "::notice:: [mock gh] Would create PR with title: $TITLE" >&2
    echo "https://github.com/mock-org/mock-repo/pull/42"
    ;;

  "pr edit")
    PR_NUM="$3"  # gh pr edit <number> ...
    TITLE=$(extract_flag_value "--title" "$@")
    echo "::notice:: [mock gh] Would edit PR #$PR_NUM with title: $TITLE" >&2
    echo "https://github.com/mock-org/mock-repo/pull/$PR_NUM"
    ;;

  *)
    echo "gh mock: unhandled command: $*" >&2
    exit 1
    ;;
esac