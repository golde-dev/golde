import { parseArgs } from "@std/cli/parse-args";
import { exec } from "sudo-prompt";
import { logger } from "./src/logger.ts";

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
  logger.info("Updating artifacts");
  const o = await new Deno.Command("gh", {
    args: ["release", "upload", version, "*"],
    cwd: `./dist/bin`,
  }).output();
  logger.info(new TextDecoder().decode(o.stdout));
  logger.error(new TextDecoder().decode(o.stderr));
}

function updateLocalAgent(): Promise<void> {
  logger.info("Updating local agent");
  return new Promise((resolve, reject) => {
    exec(
      `${import.meta.dirname}/dist/bin/agent-linux-x64 install`,
      { name: "Golde Agent" },
      function (error, stdout, stderr) {
        if (error) {
          logger.error({ error, stderr }, "Failed to update local agent");
          reject(error);
        }
        logger.info("stdout: " + stdout);
        resolve();
      },
    );
  });
}

function publish() {
  logger.info("Publishing to remote registry");
  uploadReleaseArtifacts();
}

function publishLocal() {
  logger.info("Locally installing agent");
  updateLocalAgent();
}
