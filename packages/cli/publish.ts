import { parseArgs } from "@std/cli/parse-args";
import { TextLineStream } from "@std/streams";

const { local } = parseArgs(Deno.args, {
  boolean: ["local"],
});

const localRegistry = "http://localhost:4873/";
const packages = [
  "cli",
  "cli-linux-x64",
  "cli-linux-arm64",
  "cli-win32-x64",
  "cli-darwin-x64",
  "cli-darwin-arm64",
];

if (local) {
  publishLocal();
} else {
  publish();
}

async function startVerdaccio() {
  try {
    await fetch(localRegistry);
    console.log("Verdaccio already running");
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

async function publishNPMPackage(
  pkg: string,
  registry: string,
  force: boolean = false,
) {
  if (force) {
    const { version } = JSON.parse(
      Deno.readTextFileSync(`dist/npm/@deployer/${pkg}/package.json`),
    );
    console.log(`Un-publishing @deployer/${pkg}@${version}`);

    const p = await new Deno.Command("npm", {
      args: [
        "unpublish",
        `@deployer/${pkg}@${version}`,
        "--registry",
        registry,
        "--force",
      ],
    }).output();

    const td = new TextDecoder();

    console.log(td.decode(p.stdout).trim());
    console.error(td.decode(p.stderr).trim());
  }

  const command = new Deno.Command("npm", {
    args: ["publish", "--registry", registry],
    cwd: `dist/npm/@deployer/${pkg}`,
    stdout: "piped",
    stderr: "piped",
  });

  const process = command.spawn();

  const reader = process.stdout
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  for await (const line of reader) {
    console.log(line);
  }

  const stderrReader = process.stderr
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  for await (const line of stderrReader) {
    console.error(line);
  }

  return await process.status;
}

function publish() {
  console.log("Publishing to remote registry");
}

async function publishLocal() {
  console.log("Publishing to local registry");
  const stopVerdaccio = await startVerdaccio();

  try {
    for (const pkg of packages) {
      console.log(`Publishing ${pkg}`);
      await publishNPMPackage(pkg, localRegistry, true);
    }
    publish();
  } finally {
    console.log("Stopping Verdaccio");
    stopVerdaccio?.();
  }
}
