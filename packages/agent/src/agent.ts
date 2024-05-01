import config from "./config.ts";
import { logger } from "./logger.ts";
import { createServer } from "./server.ts";

const init = () => {
  return new Promise<{ hostname: string; port: number }>((resolve, reject) => {
    const { fetch } = createServer();

    try {
      Deno.serve(
        {
          port: config.API_PORT,
          key: config.API_KEY,
          cert: config.API_CERT,
          onListen: resolve,
        },
        fetch,
      );
    } catch (error) {
      reject(error);
    }
  });
};

const scheme = "https";
init()
  .then(({ hostname, port }) => {
    logger.info(`Server listening on ${scheme}://${hostname}:${port}`);
  })
  .catch((error: unknown) => {
    logger.error("Server failed to listen", error);
  });
