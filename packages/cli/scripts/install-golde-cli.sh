#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status
set -u # Treat unset variables as an error and exit
set -o pipefail # Cause a pipeline to return the status of the last command that exited with a non-zero status

os=$(uname -s)
architecture="$(uname -m)"

# Notes
# "${os,,}" will lower case example: "Linux" to "linux"

if [[ "$architecture" == "x86_64" ]]; then version=cli-"${os,,}"-x64; else version=cli-"${os,,}"-arm64; fi

echo "Downloading ${version} version of Golde CLI"

# Check if ~/.local/bin exists, if not create it
if [ ! -d ~/.local/bin ]; then
  mkdir -p ~/.local/bin
fi

# Download golde binary
curl -fsSL https://download.golde.dev/"${version}" -o ~/.local/bin/golde


# Check if golde is executable
if [ ! -x ~/.local/bin/golde ]; then
  chmod +x ~/.local/bin/golde
fi

echo 
echo "Golde CLI installed successfully to ~/.local/bin/golde"
echo "Run 'golde configure' to configure CLI"
echo "For more information, see https://golde.dev/docs"
