import { parseArgs } from "@std/cli/parse-args";
import { TextLineStream } from "@std/streams";
import { exec } from "sudo-prompt";
import { VERSION } from "./src/version.ts";
import { logger } from "./src/logger.ts";
import { walk } from "@std/fs/walk";
import { existsSync } from "@std/fs/exists";
import { basename, join } from "@std/path";

const { local } = parseArgs(Deno.args, {
  boolean: ["local"],
});

const localRegistry = "http://localhost:4873/";
const publicRegistry = "https://registry.npmjs.org/";

const packages = [
  "cli",
  "cli-linux-x64",
  "cli-linux-arm64",
  "cli-win32-x64",
  "cli-darwin-x64",
  "cli-darwin-arm64",
];

const examples: string[] = [];
for await (const dirEntry of walk("../../examples", { maxDepth: 1 })) {
  if (existsSync(join(dirEntry.path, "package.json"))) {
    examples.push(basename(dirEntry.path));
  }
}

const decoder = new TextDecoder();
function decode(buffer: BufferSource): string {
  return decoder.decode(buffer);
}

async function startVerdaccio() {
  try {
    await fetch(localRegistry);
    logger.info("Verdaccio already running");
  } catch {
    const command = new Deno.Command("yarn", {
      args: ["dlx", "verdaccio"],
      stdout: "piped",
      stderr: "piped",
    });

    const process = command.spawn();
    return () => {
      process.kill();
    };
  }
}

async function uploadReleaseArtifacts() {
  logger.info("Updating artifacts");
  const o = await new Deno.Command("gh", {
    args: ["release", "upload", VERSION, "*"],
    cwd: `./dist/bin`,
  }).output();
  logger.info(decode(o.stdout));
  logger.error(decode(o.stderr));
}

async function publishNPMPackages(
  pkgs: string[],
  registry: string,
) {
  for (const pkg of pkgs) {
    const command = new Deno.Command("npm", {
      args: ["publish", "--registry", registry, "--loglevel", "warn"],
      cwd: `dist/npm/@golde/${pkg}`,
      stdout: "piped",
      stderr: "piped",
    });

    const process = command.spawn();

    const reader = process.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());

    for await (const line of reader) {
      logger.info(line);
    }

    const stderrReader = process.stderr
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());

    for await (const line of stderrReader) {
      logger.error(line);
    }
  }
}

async function updateLocalExamples(
  examples: string[],
  registry: string,
) {
  for (const example of examples) {
    logger.info(`Updating ${example}`);
    const { hostname } = new URL(registry);
    await new Deno.Command("yarn", {
      args: ["config", "set", "npmRegistryServer", registry],
      cwd: `../../examples/${example}`,
    }).output();
    await new Deno.Command("yarn", {
      args: [
        "config",
        "set",
        "unsafeHttpWhitelist",
        "--json",
        `["${hostname}"]`,
      ],
      cwd: `../../examples/${example}`,
    }).output();

    const o = await new Deno.Command("yarn", {
      args: ["up", "@golde/*", "--caret"],
      cwd: `../../examples/${example}`,
    }).output();
    logger.info(decode(o.stdout));
    logger.error(decode(o.stderr));

    await new Deno.Command("yarn", {
      args: ["config", "unset", "npmRegistryServer"],
      cwd: `../../examples/${example}`,
    }).output();
    await new Deno.Command("yarn", {
      args: ["config", "unset", "unsafeHttpWhitelist"],
      cwd: `../../examples/${example}`,
    }).output();

    await new Deno.Command("git", {
      args: ["restore", "yarn.lock"],
      cwd: `../../examples/${example}`,
    }).output();
    await new Deno.Command("git", {
      args: ["restore", "package.json"],
      cwd: `../../examples/${example}`,
    }).output();
  }
}

async function updateExamples(
  examples: string[],
  registry: string,
) {
  for (const example of examples) {
    logger.info(`Updating ${example}`);

    await new Deno.Command("yarn", {
      args: ["config", "set", "npmRegistryServer", registry],
      cwd: `../../examples/${example}`,
    }).output();

    const o = await new Deno.Command("yarn", {
      args: ["up", "@golde/*", "--caret"],
      cwd: `../../examples/${example}`,
    }).output();
    logger.info(decode(o.stdout));
    logger.error(decode(o.stderr));

    await new Deno.Command("yarn", {
      args: ["config", "unset", "npmRegistryServer"],
      cwd: `../../examples/${example}`,
    }).output();
  }
}

async function commitExamplesChanges() {
  logger.info("Committing examples changes");
  const o1 = await new Deno.Command("git", {
    args: ["add", "."],
    cwd: `../../examples`,
  })
    .output();
  logger.info(decode(o1.stdout));
  logger.error(decode(o1.stderr));

  const o2 = await new Deno.Command("git", {
    args: ["commit", "-m", "chore(examples): update cli client"],
    cwd: `../../examples`,
  })
    .output();
  logger.info(decode(o2.stdout));
  logger.error(decode(o2.stderr));
}

function updateLocalCLI(): Promise<void> {
  logger.info("Updating local CLI");

  return new Promise((resolve, reject) => {
    exec(
      `cp ${import.meta.dirname}/dist/bin/cli-linux-x64 /usr/local/bin/golde`,
      { name: "Golde CLI update" },
      function (error, stdout, stderr) {
        if (error) {
          logger.error({ error, stderr }, "Failed to update local agent");
          reject(error);
        }
        logger.info(stdout);
        resolve();
      },
    );
  });
}

async function publish() {
  logger.info("Publishing to remote registry");
  await publishNPMPackages(
    packages,
    publicRegistry,
  );
  // TODO: decide if we want to update examples in first release
  await updateExamples(
    packages,
    publicRegistry,
  );
  await commitExamplesChanges();
  await uploadReleaseArtifacts();
}

async function publishLocal() {
  logger.info("Publishing to local registry");
  const stopVerdaccio = await startVerdaccio();

  try {
    await updateLocalCLI();
    await publishNPMPackages(
      packages,
      localRegistry,
    );
    await updateLocalExamples(
      examples,
      localRegistry,
    );
  } finally {
    logger.info("Stopping Verdaccio");
    stopVerdaccio?.();
  }
}

if (local) {
  publishLocal();
} else {
  publish();
}
