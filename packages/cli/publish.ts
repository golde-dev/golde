import { config } from "dotenv";
import { TextLineStream } from "@std/streams";
import { exec } from "sudo-prompt";
import { VERSION } from "./src/version.ts";
import { logger } from "./src/logger.ts";
import { walk } from "@std/fs/walk";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { copy } from "@std/fs/copy";
import { env } from "node:process";
import { parseArgs } from "node:util";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { PutObjectCommandInput, PutObjectCommandOutput } from "@aws-sdk/client-s3";

config({
  override: true,
});

const { values: { dev, local } } = parseArgs({
  options: {
    dev: {
      type: "boolean",
      default: false,
    },
    local: {
      type: "boolean",
      default: false,
    },
  },
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
for await (const { path } of walk("../../examples", { maxDepth: 1 })) {
  if (existsSync(join(path, "package.json"))) {
    examples.push(basename(path));
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

function devUpdateExamples(examples: string[]) {
  const exampleBaseDir = resolve("../../examples/");

  return Promise.all(
    examples.map((example) => {
      logger.info(`Updating ${example}`);

      const goldeModules = `/node_modules/@golde`;
      const npmDistDir = "./dist/npm/@golde";

      const from = resolve(npmDistDir);
      const to = join(exampleBaseDir, example, goldeModules);

      return copy(
        from,
        to,
        {
          overwrite: true,
        },
      );
    }),
  );
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

async function devLocalCLI(): Promise<void> {
  logger.info("Updating local CLI");

  const home = homedir();
  const from = resolve("./dist/bin/cli-linux-x64");
  const to = join(home, ".local/bin/golde");
  await copy(
    from,
    to,
    { overwrite: true },
  );
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
  await uploadToS3();
  await commitExamplesChanges();
  await uploadReleaseArtifacts();
}

async function publishLocal() {
  logger.info("Publishing to local registry");
  const stopVerdaccio = await startVerdaccio();

  try {
    await updateLocalCLI();
    await uploadToS3();
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

async function uploadToS3() {
  logger.info("Publishing CLI to S3 bucket");

  const endpoint = env.S3_ENDPOINT;
  if (!endpoint) {
    logger.error("S3 endpoint not found skipping upload");
    return;
  }
  const accessKeyId = env.S3_ACCESS_KEY_ID;
  if (!accessKeyId) {
    logger.error("S3 access key id not found skipping upload");
    return;
  }
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY;
  if (!secretAccessKey) {
    logger.error("S3 secret access key not found skipping upload");
    return;
  }
  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  const cliLinuxX64 = readFileSync("./dist/bin/cli-linux-x64");
  const cliLinuxX64Command = new PutObjectCommand({
    Bucket: "golde-download",
    Key: "cli-linux-x64",
    Body: cliLinuxX64,
  });
  await client.send<PutObjectCommandInput, PutObjectCommandOutput>(cliLinuxX64Command);

  const cliInstall = readFileSync("./scripts/install-golde-cli.sh");
  const cliInstallCommand = new PutObjectCommand({
    Bucket: "golde-download",
    Key: "install-golde-cli.sh",
    Body: cliInstall,
  });
  await client.send<PutObjectCommandInput, PutObjectCommandOutput>(cliInstallCommand);
}

async function publishLocalDev() {
  logger.info("Publishing to local registry");
  await devUpdateExamples(examples);
  await devLocalCLI();
  await uploadToS3();
}

if (dev) {
  publishLocalDev();
} else if (local) {
  publishLocal();
} else {
  publish();
}
