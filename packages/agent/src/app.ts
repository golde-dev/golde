import config from "./config.js";
import logger from "./logger.js";
import {createServer} from "./server.js";

/**
 * Handle exceptions
 */
process.on("uncaughtException", (error) => {
  logger.error({error}, "uncaughtException");
});

const init = async() => {
  const server = await createServer();

  try {
    await server.listen({
      port: config.API_PORT,
    }); 
  }
  catch (error) {
    logger.error(error, "Server failed to listen");
  }  
};

init();