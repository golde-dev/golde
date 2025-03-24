#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const { argv, exit, arch, platform } = require("node:process");

function getExePath() {
  const extension = platform === "win32" ? ".exe" : "";

  try {
    return require.resolve(
      `@golde/cli-${platform}-${arch}/bin/cli-${platform}-${arch}${extension}`,
    );
  } catch (e) {
    throw new Error(
      `Couldn't find application binary inside node_modules for ${platform}-${arch}`,
      { cause: e },
    );
  }
}

const exePath = getExePath();
const args = argv.slice(2);
const { status } = spawnSync(
  exePath,
  args,
  { stdio: "inherit" }
);

exit(
  status ?? 0
);