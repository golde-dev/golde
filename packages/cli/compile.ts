import { decode } from "./src/utils/text.ts";
import { logger } from "./src/logger.ts";
import { parseArgs } from "node:util";
import { mkdirSync } from "node:fs";
import { existsSync } from "node:fs";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { platform, tmpdir } from "node:os";
import { join, resolve } from "node:path";

const { values: { dev } } = parseArgs({
  options: {
    dev: {
      type: "boolean",
      default: false,
    },
  },
});

const plat = platform();

const staging = await createStaging();
try {
  await (dev ? compileDev(staging) : compileProd(staging));
} finally {
  await rm(staging, { recursive: true, force: true });
}

/**
 * Binaries are compiled in BYONM mode so that `import()` of a user's golde.config.ts
 * resolves bare specifiers from the user's node_modules. BYONM embeds the whole
 * node_modules, so compile from a copy with production dependencies only.
 */
async function createStaging(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "golde-compile-"));
  await cp("./src", join(dir, "src"), { recursive: true });
  await cp("./deno.json", join(dir, "deno.json"));
  await cp("./deno.lock", join(dir, "deno.lock"));

  const { devDependencies: _, ...packageJSON } = JSON.parse(
    await readFile("./package.json", "utf8"),
  );
  await writeFile(join(dir, "package.json"), JSON.stringify(packageJSON, null, 2));

  const { stderr, success } = await new Deno.Command("deno", {
    args: ["install"],
    cwd: dir,
  }).output();
  if (!success) {
    throw new Error(`[Compile][CLI] Failed to install dependencies: ${decode(stderr)}`);
  }
  return dir;
}

/**
 * Detect and only compile for current arch
 */
async function compileDev(staging: string) {
  if(existsSync("./dist/bin")) {
    await mkdirSync("./dist/bin", { recursive: true });
  }

  if (plat === "linux") {
    await Promise.all([
      compile(staging, "x86_64-unknown-linux-gnu", "./dist/bin/cli-linux-x64", true),
    ]);
  }
  if (plat === "darwin") {
    await Promise.all([
      compile(staging, "x86_64-apple-darwin", "./dist/bin/cli-darwin-x64", true),
      compile(staging, "aarch64-apple-darwin", "./dist/bin/cli-darwin-arm64", true),
    ]);
  }
  if (plat === "win32") {
    await Promise.all([
      compile(staging, "x86_64-pc-windows-msvc", "./dist/bin/cli-win32-x64", true),
    ]);
  }
}

async function compileProd(staging: string) {
  if(existsSync("./dist/bin")) {
    await mkdirSync("./dist/bin", { recursive: true });
  }
  await Promise.all([
    compile(staging, "x86_64-unknown-linux-gnu", "./dist/bin/cli-linux-x64", false),
    compile(staging, "aarch64-unknown-linux-gnu", "./dist/bin/cli-linux-arm64", false),
    compile(staging, "x86_64-pc-windows-msvc", "./dist/bin/cli-win32-x64", false),
    compile(staging, "x86_64-apple-darwin", "./dist/bin/cli-darwin-x64", false),
    compile(staging, "aarch64-apple-darwin", "./dist/bin/cli-darwin-arm64", false),
  ]);
}

type Target =
  | "x86_64-unknown-linux-gnu"
  | "aarch64-unknown-linux-gnu"
  | "x86_64-pc-windows-msvc"
  | "x86_64-apple-darwin"
  | "aarch64-apple-darwin";

async function compile(staging: string, target: Target, path: string, local: boolean) {
  logger.info(`[Compile][CLI] Compiling target: ${target}`);

  const perms = [
    "--allow-read",
    "--allow-write",
    "--allow-sys",
    "--allow-net",
    "--allow-env",
    "--allow-run",
  ];

  const cert = local ? ["--cert", resolve("../../certs/golde.localhost.root.crt")] : [];

  const args = [
    "compile",
    "--node-modules-dir=manual",
    // Type checking happens in `deno check src` before compile
    "--no-check",
    ...cert,
    ...perms,
    "--target",
    target,
    "--output",
    resolve(path),
    "./src/cli.ts",
  ];

  const { stderr, stdout, success } = await new Deno.Command("deno", {
    args,
    cwd: staging,
  }).output();

  if (!success) {
    logger.error(`[Compile][CLI] Failed compilation for ${target} path: ${path}`);
    const error = decode(stderr);
    if (error) {
      logger.error(error);
    }
    const output = decode(stdout);
    if (output) {
      logger.info(output);
    }
  } else {
    logger.info(`[Compile][CLI] completed target: ${target}`);
  }
}
