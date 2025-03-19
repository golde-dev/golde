interface WithVersion {
  default: {
    version: string;
    goldeURL?: string;
  };
}

let goldeURL = "https://api.golde.dev/v1";

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
    goldeURL: localGoldeUrl,
  },
} = await import("../../../local.json", {
  with: { type: "json" },
}).catch(() => ({ default: { version: null } })) as WithVersion;

if (localVersion) version += "-" + localVersion;
if (localGoldeUrl) goldeURL = localGoldeUrl;

export const VERSION = version;
export const GOLDE_API_URL = goldeURL;
