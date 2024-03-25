import config from "./config.js";
import logger from "./logger.js";
import {createServer} from "./server.js";

/**
 * Handle exceptions
 */
process.on("uncaughtException", (error) => {
  logger.error("uncaughtException", {error});
});

const init = async() => {
  const server = await createServer();

  await server.listen({
    port: config.API_PORT,
  });
};

init().catch((error: unknown) => {
  logger.error("Server failed to listen", error);
});