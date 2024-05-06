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

const examples = [
  "dns-cloudflare",
  "service-vite-react-node",
  "service-vite-react",
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
) {
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

async function updateExample(example: string, registry: string) {
  const { hostname } = new URL(registry);
  await new Deno.Command("yarn", {
    args: ["config", "set", "npmRegistryServer", registry],
    cwd: `../examples/${example}`,
  }).output();
  await new Deno.Command("yarn", {
    args: [
      "config",
      "set",
      "unsafeHttpWhitelist",
      "--json",
      `["${hostname}"]`,
    ],
    cwd: `../examples/${example}`,
  }).output();

  const o = await new Deno.Command("yarn", {
    args: ["up", "@deployer/*"],
    cwd: `../examples/${example}`,
  }).output();
  console.log(new TextDecoder().decode(o.stdout));
  console.error(new TextDecoder().decode(o.stderr));

  await new Deno.Command("yarn", {
    args: ["config", "unset", "npmRegistryServer"],
    cwd: `../examples/${example}`,
  }).output();
  await new Deno.Command("yarn", {
    args: ["config", "unset", "unsafeHttpWhitelist"],
    cwd: `../examples/${example}`,
  }).output();
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
      await publishNPMPackage(pkg, localRegistry);
    }
    for (const example of examples) {
      console.log(`Updating ${example}`);
      await updateExample(example, localRegistry);
    }
  } finally {
    console.log("Stopping Verdaccio");
    stopVerdaccio?.();
  }
}
