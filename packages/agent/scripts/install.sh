#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status
set -u # Treat unset variables as an error and exit
set -o pipefail # Cause a pipeline to return the status of the last command that exited with a non-zero status


architecture="$(uname -m)"

if [[ "$architecture" == "x86_64" ]]; then
  curl -fsSL \
    https://github.com/deployer/deployer/releases/latest/download/agent-linux-x64 \
    -o /tmp/deployer-agent
else
  curl -fsSL \
    https://github.com/deployer/deployer/releases/latest/download/agent-linux-arm64 \
    -o /tmp/deployer-agent
fi

./tmp/deployer-agent install
