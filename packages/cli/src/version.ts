// deno-lint-ignore-file no-empty

interface WithVersion {
  default: {
    version: string;
  };
}

let {
  default: {
    version,
  },
} = await import("../../../lerna.json", {
  with: { type: "json" },
}) as WithVersion;

const {
  default: {
    version: localVersion,
  },
} = await import("../../../local.json", {
  with: { type: "json" },
}).catch(() => ({ default: { version: null } })) as WithVersion;

if (localVersion) version += "-" + localVersion;

export const VERSION = version;
