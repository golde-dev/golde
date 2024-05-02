import { parseArgs } from "@std/cli/parse-args";

const flags = parseArgs(Deno.args, {
  boolean: ["local"],
});

const { local } = flags;

if (local) {
  publishLocal();
} else {
  publish();
}

function publish() {
  console.log("Publishing to remote registry");
}

function publishLocal() {
  console.log("Publishing to local registry");
}
