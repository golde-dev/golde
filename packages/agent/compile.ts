import { parseArgs } from "@std/cli/parse-args";
import { ensureDir } from "@std/fs/ensure-dir";
import { logger } from "./src/logger.ts";

logger.configure("INFO", true);

const decoder = new TextDecoder();
const { local } = parseArgs(Deno.args, {
  boolean: ["local"],
});

if (local) {
  compileLocal();
} else {
  compileProd();
}

async function compileLocal() {
  await ensureDir("./dist/bin");
  await Promise.all([
    compile("x86_64-unknown-linux-gnu", "./dist/bin/agent-linux-x64"),
    compile("aarch64-unknown-linux-gnu", "./dist/bin/agent-linux-arm64"),
  ]);
}

async function compileProd() {
  await ensureDir("./dist/bin");
  await Promise.all([
    compile("x86_64-unknown-linux-gnu", "./dist/bin/agent-linux-x64"),
    compile("aarch64-unknown-linux-gnu", "./dist/bin/agent-linux-arm64"),
  ]);
}

type Target =
  | "x86_64-unknown-linux-gnu"
  | "aarch64-unknown-linux-gnu";

async function compile(target: Target, path: string) {
  logger.info(`Agent Compiling target: ${target}`);

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

  const { stderr, stdout, success } = await new Deno.Command("deno", {
    args,
  }).output();

  if (!success) {
    logger.error(`Failed Agent compilation for ${target} path: ${path}`);
    logger.info(decoder.decode(stdout));
    logger.error(decoder.decode(stderr));
    Deno.exit(1);
  } else {
    logger.info(`Agent complete target: ${target}`);
  }
}
