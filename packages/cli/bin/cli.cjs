#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

function getExePath() {
  const { arch, platform } = process;
  const extension = platform === "win32" ? ".exe" : "";

  try {
    return require.resolve(
      `@deployer/cli-${platform}-${arch}/bin/cli-${platform}-${arch}${extension}`,
    );
  } catch (e) {
    throw new Error(
      `Couldn't find application binary inside node_modules for ${platform}-${arch}`,
      { cause: e },
    );
  }
}

const exePath = getExePath();
const args = process.argv.slice(2);
const { status } = spawnSync(
  exePath,
  args,
  { stdio: "inherit" }
);

process.exit(
  status ?? 0
);