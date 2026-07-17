#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

install_act() {
    echo "1. Installing 'act' library for local GitHub actions"

    local current_act_version="none"
    local target_act_version="none"

    if command -v act >/dev/null 2>&1; then
        current_act_version=$(act --version | awk '{print $3}')
    fi

    if [ -f ".env" ]; then
        # Safely extract the ACT_VERSION value, ignoring comments, and removing quotes
        target_act_version=$(grep -E '^ACT_VERSION=' .env | cut -d '=' -f 2- | tr -d '"' | tr -d "'")
    fi

    echo "Target 'act' version: $target_act_version"
    echo "Current 'act' version: $current_act_version"

    if ! command -v curl >/dev/null 2>&1; then
        echo "Error: 'curl' is required to install or upgrade 'act' but was not found."
        exit 1
    fi

    # 2. Check if we actually need to install or upgrade
    if [ "$current_act_version" = "$target_act_version" ]; then
        echo "'act' is already installed at the correct version ($target_act_version)."
        return 0
    fi

    if [ "$current_act_version" = "none" ]; then
        echo "Installing 'act' version $target_act_version..."
    else
        echo "Upgrading 'act' from $current_act_version to $target_act_version..."
    fi

    # Determine if we can use sudo. (Windows Git Bash usually doesn't have it)
    if command -v sudo >/dev/null 2>&1; then
        # Has sudo: Install globally to /usr/local/bin
        curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash -s -- -b /usr/local/bin v${TARGET_VERSION}
    else
        # No sudo: Install locally to ~/.local/bin and ensure it's in the PATH
        mkdir -p ~/.local/bin
        echo "'act' is being installed into ~/.local/bin directory."
        curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | bash -s -- -b ~/.local/bin v${TARGET_VERSION}

        # Optional: Remind the user if ~/.local/bin isn't in their PATH
        if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
            echo "Note: ~/.local/bin is not in your PATH. You may need to add it to run 'act' globally."
        fi
    fi

    # 4. Verify installation
    new_version=$(get_installed_version)

    local new_version=$(act --version | awk '{print $3}')
    if [ "$new_version" = "$target_act_version" ]; then
        echo -e "\nSuccess! 'act@$new_version' has been installed on your system."
    else
        echo -e "\nError: Installation appeared to finish, but the version installed ($new_version) is different from the target one ($target_act_version)."
        return 1
    fi
}

update_git_config() {
  echo -e "\n1. Updating local git config."

  if ! command -v git >/dev/null 2>&1; then
    echo "Error: 'git' is not installed on your system. Please install 'git' and run the script again."
    exit 1
  fi

  echo "Setting 'git cz' as an alias to 'git commit' to enforce conventional commits."

  if [[ $(command git config --local alias.cz) = "!pnpm cz" ]]; then
    echo "You local git config already has correct 'cz' alias."
    return 0
  else
    command git config --local alias.cz '!pnpm cz'
    echo "Success! local git config has been updated."
  fi
}

install_act
update_git_config

echo -e "\nAll setup steps completed successfully!"