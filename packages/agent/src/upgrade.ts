// TODO: add version check in releases page to ensure that we are overmatching same version
// TODO: trigger install on new version of binary
export async function upgrade() {
  const url = Deno.build.arch === "x86_64"
    ? "https://github.com/golde/golde/releases/latest/download/agent-linux-x64"
    : "https://github.com/golde/golde/releases/latest/download/agent-linux-arm64";

  const { body } = await fetch(
    url,
    {
      method: "GET",
    },
  );

  if (body) {
    const file = await Deno.open("./tmp/golde-agent", {
      write: true,
      create: true,
    });

    await body.pipeTo(file.writable);
  }
}
