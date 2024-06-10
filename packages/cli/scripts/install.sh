#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status
set -u # Treat unset variables as an error and exit
set -o pipefail # Cause a pipeline to return the status of the last command that exited with a non-zero status

os=$(uname -s)
architecture="$(uname -m)"

if [[ "$architecture" == "x86_64" ]]; then
  curl -fsSL \
    https://github.com/deployer/deployer/releases/latest/download/cli-"${os,,}"-x64 \
    -o /usr/local/bin/deployer
else
  curl -fsSL \
    https://github.com/deployer/deployer/releases/latest/download/cli-"${os,,}"-arm64 \
    -o /usr/local/bin/deployer
fi

sudo chmod +x /usr/local/bin/deployer

