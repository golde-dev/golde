import { parseArgs } from "@std/cli/parse-args";
import { exec } from "sudo-prompt";

const { version } = JSON.parse(
  Deno.readTextFileSync("../../lerna.json"),
);
const flags = parseArgs(Deno.args, {
  boolean: ["local"],
});

const { local } = flags;

if (local) {
  publishLocal();
} else {
  publish();
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

function updateLocalAgent(): Promise<void> {
  console.log("Updating local agent");
  return new Promise((resolve, reject) => {
    exec(
      `${import.meta.dirname}/dist/bin/agent-linux-x64 install`,
      { name: "Golde Agent" },
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

function publish() {
  console.log("Publishing to remote registry");
  uploadReleaseArtifacts();
}

function publishLocal() {
  console.log("Locally installing agent");
  updateLocalAgent();
}
