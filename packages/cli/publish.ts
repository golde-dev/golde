import { parseArgs } from "@std/cli/parse-args";
import { TextLineStream } from "@std/streams";
import { exec } from "sudo-prompt";

const { version } = JSON.parse(
  Deno.readTextFileSync("../../lerna.json"),
);
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

const examples = [
  "dns-cloudflare",
  "service-vite-react-node",
  "service-vite-react",
];

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

async function uploadReleaseArtifacts() {
  console.log("Updating artifacts");
  const o = await new Deno.Command("gh", {
    args: ["release", "upload", version, "*"],
    cwd: `./dist/bin`,
  }).output();
  console.log(new TextDecoder().decode(o.stdout));
  console.error(new TextDecoder().decode(o.stderr));
}

async function publishNPMPackage(
  pkg: string,
  registry: string,
) {
  const command = new Deno.Command("npm", {
    args: ["publish", "--registry", registry],
    cwd: `dist/npm/@golde/${pkg}`,
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

async function updateExample(
  example: string,
  registry: string,
  reset: boolean = false,
) {
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
    args: ["up", "@golde/*", "--caret"],
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

  if (reset) {
    await new Deno.Command("git", {
      args: ["restore", "yarn.lock"],
      cwd: `../examples/${example}`,
    }).output();
    await new Deno.Command("git", {
      args: ["restore", "package.json"],
      cwd: `../examples/${example}`,
    }).output();
  }
}

function updateLocalCLI(): Promise<void> {
  console.log("Updating local CLI");

  return new Promise((resolve, reject) => {
    exec(
      `cp ${import.meta.dirname}/dist/bin/cli-linux-x64 /usr/local/bin/golde`,
      { name: "Golde CLI update" },
      function (error, stdout, stderr) {
        if (error) {
          console.error({ error, stderr }, "Failed to update local agent");
          reject(error);
        }
        console.log("stdout: " + stdout);
        resolve();
      },
    );
  });
}

async function publish() {
  console.log("Publishing to remote registry");
  for (const pkg of packages) {
    console.log(`Publishing ${pkg}`);
    await publishNPMPackage(pkg, publicRegistry);
  }
  await uploadReleaseArtifacts();
  for (const example of examples) {
    console.log(`Updating ${example}`);
    await updateExample(
      example,
      publicRegistry,
      false,
    );
  }
}

async function publishLocal() {
  console.log("Publishing to local registry");
  const stopVerdaccio = await startVerdaccio();

  try {
    await updateLocalCLI();
    for (const pkg of packages) {
      console.log(`Publishing ${pkg}`);
      await publishNPMPackage(pkg, localRegistry);
    }
    for (const example of examples) {
      console.log(`Updating ${example}`);
      await updateExample(
        example,
        localRegistry,
        true,
      );
    }
  } finally {
    console.log("Stopping Verdaccio");
    stopVerdaccio?.();
  }
}

if (local) {
  publishLocal();
} else {
  publish();
}
