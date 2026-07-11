git() {
  if [[ "$1" == "commit" ]]; then
    local args=("${@:2}")
    local has_message=false
    for arg in "${args[@]}"; do
      case "$arg" in
        -m|--message|--message=*|-F|--file|--file=*|-C*|-c*|--reuse-message*|--reedit-message*|--amend|--fixup*|--squash*|--no-edit)
          has_message=true
          break
          ;;
      esac
    done
    if [[ "$has_message" == false ]]; then
      command git commit -m "" --allow-empty-message "${args[@]}"
    else
      command git commit "${args[@]}"
    fi
  else
    command git "$@"
  fi
}