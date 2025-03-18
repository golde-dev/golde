import { parseArgs } from "@std/cli/parse-args";
import { ensureDir } from "@std/fs/ensure-dir";
import { decode } from "./src/utils/text.ts";
import { logger } from "./src/logger.ts";

const { local, dev } = parseArgs(Deno.args, {
  boolean: ["local", "dev"],
});

if (dev) {
  compileDev();
} else if (local) {
  compileLocal();
} else {
  compileProd();
}

async function compileLocal() {
  await ensureDir("./dist/bin");
  await Promise.all([
    compile("x86_64-unknown-linux-gnu", "./dist/bin/cli-linux-x64", true),
    compile("aarch64-unknown-linux-gnu", "./dist/bin/cli-linux-arm64", true),
    compile("x86_64-pc-windows-msvc", "./dist/bin/cli-win32-x64", true),
    compile("x86_64-apple-darwin", "./dist/bin/cli-darwin-x64", true),
    compile("aarch64-apple-darwin", "./dist/bin/cli-darwin-arm64", true),
  ]);
}

/**
 * Detect and only compile for current arch
 */
async function compileDev() {
  await ensureDir("./dist/bin");
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
  await ensureDir("./dist/bin");
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
  logger.info(`CLI compiling target: ${target}`);

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
    "--no-check",
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
    logger.error(`Failed CLI compilation for ${target} path: ${path}`);
    logger.info(decode(stdout));
    logger.error(decode(stderr));
    Deno.exit(1);
  } else {
    logger.info(`CLI complete target: ${target}`);
  }
}
