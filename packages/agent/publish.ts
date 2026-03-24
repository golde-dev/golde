import { readFileSync } from "node:fs";
import { logger } from "./src/logger.ts";
import { parseArgs } from "node:util";

const decoder = new TextDecoder();
const { version } = JSON.parse(
  readFileSync("../../lerna.json", { encoding: "utf-8" }),
);

const { values: { local } } = parseArgs({
  options: {
    local: {
      type: "boolean",
      default: false,
    },
  },
});

if (local) {
  publishLocal();
} else {
  publish();
}

async function uploadReleaseArtifacts() {
  logger.info("Updating artifacts");
  const { stdout, stderr } = await new Deno.Command("gh", {
    args: ["release", "upload", version, "*"],
    cwd: `./dist/bin`,
  }).output();
  logger.info(decoder.decode(stdout));
  logger.error(decoder.decode(stderr));
}

function updateLocalAgent() {
  logger.info("Updating local agent");
 
}

function publish() {
  logger.info("Publishing to remote registry");
  uploadReleaseArtifacts();
}

function publishLocal() {
  logger.info("Locally installing agent");
  updateLocalAgent();
}
