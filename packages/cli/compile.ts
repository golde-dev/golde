import { decode } from "./src/utils/text.ts";
import { logger } from "./src/logger.ts";
import { parseArgs } from "node:util";
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
  compileDev();
} else {
  compileProd();
}

/**
 * Detect and only compile for current arch
 */
async function compileDev() {
  if(existsSync("./dist/bin")) {
    await mkdirSync("./dist/bin", { recursive: true });
  }

  if (Deno.build.os === "linux") {
    await Promise.all([
      compile("x86_64-unknown-linux-gnu", "./dist/bin/cli-linux-x64", true),
    ]);
  }
  if (Deno.build.os === "darwin") {
    await Promise.all([
      compile("x86_64-apple-darwin", "./dist/bin/cli-darwin-x64", true),
      compile("aarch64-apple-darwin", "./dist/bin/cli-darwin-arm64", true),
    ]);
  }
  if (Deno.build.os === "windows") {
    await Promise.all([
      compile("x86_64-pc-windows-msvc", "./dist/bin/cli-win32-x64", true),
    ]);
  }
}

async function compileProd() {
  if(existsSync("./dist/bin")) {
    await mkdirSync("./dist/bin", { recursive: true });
  }
  await Promise.all([
    compile("x86_64-unknown-linux-gnu", "./dist/bin/cli-linux-x64", false),
    compile("aarch64-unknown-linux-gnu", "./dist/bin/cli-linux-arm64", false),
    compile("x86_64-pc-windows-msvc", "./dist/bin/cli-win32-x64", false),
    compile("x86_64-apple-darwin", "./dist/bin/cli-darwin-x64", false),
    compile("aarch64-apple-darwin", "./dist/bin/cli-darwin-arm64", false),
  ]);
}

type Target =
  | "x86_64-unknown-linux-gnu"
  | "aarch64-unknown-linux-gnu"
  | "x86_64-pc-windows-msvc"
  | "x86_64-apple-darwin"
  | "aarch64-apple-darwin";

async function compile(target: Target, path: string, local: boolean) {
  logger.info(`[Compile][CLI] Compiling target: ${target}`);

  const perms = [
    "--allow-read",
    "--allow-write",
    "--allow-sys",
    "--allow-net",
    "--allow-env",
    "--allow-run",
  ];

  const cert = local ? ["--cert", "../../certs/golde.localhost.root.crt"] : [];

  const args = [
    "compile",
    ...cert,
    ...perms,
    "--target",
    target,
    "--output",
    path,
    "./src/cli.ts",
  ];

  const { stderr, stdout, success } = await new Deno.Command("deno", {
    args,
  }).output();

  if (!success) {
    logger.error(`[Compile][CLI] Failed compilation for ${target} path: ${path}`);
    const error = decode(stderr);
    if (error) {
      console.log(error);
    }
    const output = decode(stdout);
    if (output) {
      console.log(output);
    }
  } else {
    logger.info(`[Compile][CLI] completed target: ${target}`);
  }
}
