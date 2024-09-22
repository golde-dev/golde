import { logger } from "./logger.ts";

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

/*
 * Local.json file only exists only when running yarn local
 */
try {
  const {
    default: {
      version: localVersion,
    },
  } = await import("../../../local.json", {
    with: { type: "json" },
  }) as WithVersion;

  if (localVersion) version += "-" + localVersion;
} finally {
  logger.info("VERSION: ", version);
}

export const VERSION = version;
