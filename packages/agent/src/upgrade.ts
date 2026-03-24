import process from "node:process";
import { createWriteStream } from "node:fs";

// TODO: add version check in releases page to ensure that we are overmatching same version
// TODO: trigger install on new version of binary
export async function upgrade() {
  const url = process.arch === "x64"
    ? "https://github.com/golde/golde/releases/latest/download/agent-linux-x64"
    : "https://github.com/golde/golde/releases/latest/download/agent-linux-arm64";

  const response = await fetch(
    url,
    {
      method: "GET",
    },
  );

  if (response.ok) {
    const arrayBuffer = await response.arrayBuffer();
    const writeStream = createWriteStream("./tmp/golde-agent");
    await writeStream.write(arrayBuffer);
  }
  else {
    throw new Error(`Failed to download golde agent: status code: ${response.status}`);
  }
}
