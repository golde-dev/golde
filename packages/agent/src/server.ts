import type {FastifyBaseLogger} from "fastify";
import fastify from "fastify";
import logger from "./logger.js";
import healthcheck from "./routes/healthcheck";
import type {FastifyServer} from "./types/Server";
import { exit } from "process";


export const createServer = async(): Promise<FastifyServer> => {
  const server: FastifyServer = fastify({
    logger: logger as FastifyBaseLogger,
  });

  try {
    /**
     * Register Routes
     */
    await server.register(healthcheck, {prefix: "/api"});
  
    server.after((err: Error | null) => {
      if (err) {
        logger.error(err, "Handle errors after middleware");
        exit(1); 
      }
    });
    server.ready((err: Error | null) => {
      if (err) {
        logger.error(err, "Handle errors ready middleware");
        exit(1);
      }
    });
    
    return server;
  }
  catch (error) {
    logger.error(error, "Failed to init server, exiting");
    exit(1);
  }
};