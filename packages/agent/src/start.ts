import config from "./config.ts";
import { logger } from "./logger.ts";
import { createServer } from "./server.ts";

const scheme = "https";

export function start() {
  const { fetch } = createServer();

  try {
    Deno.serve(
      {
        port: config.API_PORT,
        key: config.API_KEY,
        cert: config.API_CERT,
        onListen: ({ hostname, port }) => {
          logger.info(`Agent listening on ${scheme}://${hostname}:${port}`);
        },
      },
      fetch,
    );
  } catch (error) {
    logger.error("Server failed to listen", error);
  }
}
