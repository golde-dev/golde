import { parseArgs } from "node:util";
import { $, ExecaError } from "execa";
import { logger } from "./src/logger.ts";
import { mkdirSync } from "node:fs";
import { existsSync } from "node:fs";

const { values: { dev } } = parseArgs({
  options: {
    dev: {
      type: "boolean",
      default: false,
    },
  },
});

if (dev) {
  compileLocal();
} else {
  compileProd();
}

async function compileLocal() {
  if (existsSync("./dist/bin")) {
    await mkdirSync("./dist/bin", { recursive: true });
  }
  await Promise.all([
    compile("x86_64-unknown-linux-gnu", "./dist/bin/agent-linux-x64"),
    compile("aarch64-unknown-linux-gnu", "./dist/bin/agent-linux-arm64"),
  ]);
}

async function compileProd() {
  if (existsSync("./dist/bin")) {
    await mkdirSync("./dist/bin", { recursive: true });
  }
  await Promise.all([
    compile("x86_64-unknown-linux-gnu", "./dist/bin/agent-linux-x64"),
    compile("aarch64-unknown-linux-gnu", "./dist/bin/agent-linux-arm64"),
  ]);
}

type Target =
  | "x86_64-unknown-linux-gnu"
  | "aarch64-unknown-linux-gnu";

async function compile(target: Target, path: string) {
  logger.info(`[Compile][Agent] Compiling target: ${target}`);

  const perms = [
    "--allow-read",
    "--allow-write",
    "--allow-sys",
    "--allow-net",
    "--allow-env",
    "--allow-run",
  ];

  const args = [
    "compile",
    ...perms,
    "--target",
    target,
    "--output",
    path,
    "./src/bin/agent.ts",
  ];

  try {
    await $`deno ${args}`;
    logger.info(`[Compile][Agent] Agent complete target: ${target}`);
  } catch (error) {
    logger.error(`[Compile][Agent] Failed compilation for ${target} path: ${path}`);
    if (error instanceof ExecaError) {
      if (error.stderr) {
        console.error(error.stderr);
      }
      if (error.stdout) {
        console.info(error.stdout);
      }
    } else {
      throw error;
    }
  }
}
