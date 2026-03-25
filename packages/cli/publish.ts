import { exit, loadEnvFile } from "node:process";
import { VERSION } from "./src/version.ts";
import { logger } from "./src/logger.ts";
import { walk } from "@std/fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { copy } from "@std/fs/copy";
import { env } from "node:process";
import { parseArgs } from "node:util";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { PutObjectCommandInput, PutObjectCommandOutput } from "@aws-sdk/client-s3";
import { $ } from "execa";

if (existsSync(".env")) {
  loadEnvFile();
}

const { values: { dev } } = parseArgs({
  options: {
    dev: {
      type: "boolean",
      default: false,
    },
  },
});

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadReleaseArtifacts() {
  logger.info("[Publish][CLI] Updating artifacts");
  const { stdout, stderr } = await $({ cwd: "./dist/bin", shell: true })`gh release upload v${VERSION} *`;
  logger.info(stdout);
  logger.error(stderr);
}

async function publishNPMPackages(
  pkgs: string[],
) {
  for (const pkg of pkgs) {
    try {
      const { stdout, stderr } = await $({ cwd: `dist/npm/@golde/${pkg}` })`npm publish --access public`;
      logger.info(stdout);
      logger.error(stderr);
    } catch (error) {
      logger.error(error, "[Publish][CLI] Failed to publish package");
      exit(1);
    }
  }
}

function devUpdateExamples(examples: string[]) {
  const exampleBaseDir = resolve("../../examples/");

  return Promise.all(
    examples.map((example) => {
      logger.info(`[Publish][CLI] Updating example ${example}`);

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

async function prodUpdateExamples(
  examples: string[],
) {
  for (const example of examples) {
    logger.info(`[Publish][CLI] Updating ${example}`);
    const cwd = `../../examples/${example}`;

    const { stdout, stderr } = await $({ cwd })`yarn up @golde/* --caret`;
    logger.info(stdout);
    logger.error(stderr);
  }
}

async function commitExamplesChanges() {
  logger.info("[Publish][CLI] Committing examples changes");
  const cwd = "../../examples";

  const o1 = await $({ cwd })`git add .`;
  logger.info(o1.stdout);
  logger.error(o1.stderr);

  const o2 = await $({ cwd })`git commit -m ${"chore(examples): update examples cli client"}`;
  logger.info(o2.stdout);
  logger.error(o2.stderr);

  const o3 = await $`git push`;
  logger.info(o3.stdout);
  logger.error(o3.stderr);
}

async function updateLocalCLI(): Promise<void> {
  logger.info("[Publish][CLI] Updating local CLI");

  const home = homedir();
  const from = resolve("./dist/bin/cli-linux-x64");
  const to = join(home, ".local/bin/golde");
  await copy(
    from,
    to,
    { overwrite: true },
  );
}


async function uploadToS3() {
  logger.info("[Publish][CLI] Publishing CLI to S3 bucket");

  const endpoint = env.S3_ENDPOINT;
  if (!endpoint) {
    logger.error("[Publish][CLI] S3 endpoint not found skipping upload");
    return;
  }
  const accessKeyId = env.S3_ACCESS_KEY_ID;
  if (!accessKeyId) {
    logger.error("[Publish][CLI] S3 access key id not found skipping upload");
    return;
  }
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY;
  if (!secretAccessKey) {
    logger.error("[Publish][CLI] S3 secret access key not found skipping upload");
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

  const versions = [
    "cli-linux-x64",
    "cli-linux-arm64",
    "cli-win32-x64.exe",
    "cli-darwin-arm64",
    "cli-darwin-x64",
  ]

  for (const version of versions) {
    const binary = readFileSync(`./dist/bin/${version}`);
    const cliBinaryCommand = new PutObjectCommand({
      Bucket: "mapka-download",
      Key: version,
      Body: binary,
    });
    await client.send<PutObjectCommandInput, PutObjectCommandOutput>(cliBinaryCommand);
  }

  const cliInstall = readFileSync("./scripts/install-golde-cli.sh");
  const cliInstallCommand = new PutObjectCommand({
    Bucket: "golde-download",
    Key: "install-golde-cli.sh",
    Body: cliInstall,
  });
  await client.send<PutObjectCommandInput, PutObjectCommandOutput>(cliInstallCommand);
}


async function publishProd() {
  logger.info("[Publish][CLI] Publishing to remote registry");
  
  await publishNPMPackages(
    packages,
  );

  await sleep(20_000)

  await prodUpdateExamples(
    examples,
  );
  await uploadToS3();
  await commitExamplesChanges();
  await uploadReleaseArtifacts();
}

async function publishDev() {
  logger.info("[Publish][CLI] Publishing locally");
  await devUpdateExamples(examples);
  await updateLocalCLI();
  await uploadToS3();
}

if (dev) {
  publishDev();
} else {
  publishProd();
}
