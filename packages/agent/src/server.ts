import type {FastifyBaseLogger} from "fastify";
import fastify from "fastify";
import type { CustomLogger } from "./logger.js";
import defaultLogger from "./logger.js";
import healthcheck from "./routes/healthcheck";
import type {FastifyServer} from "./types/Server";
import { exit } from "process";
import type { ChildLoggerOptions } from "fastify/types/logger.js";

const winstonLogger = (logger: CustomLogger): FastifyBaseLogger => ({
  level: logger.level,

  fatal: (obj: unknown, msg?: string) => msg 
    ? logger.fatal(msg, obj)
    : logger.fatal(obj),
    
  error: (obj: unknown, msg?: string) => msg 
    ? logger.error(msg, obj)
    : logger.error(obj),
  
  warn: (obj: unknown, msg?: string) => msg 
    ? logger.warn(msg, obj)
    : logger.warn(obj),

  info: (obj: unknown, msg?: string) => msg 
    ? logger.info(msg, obj)
    : logger.info(obj),

  debug: (obj: unknown, msg?: string) => msg 
    ? logger.debug(msg, obj)
    : logger.debug(obj),

  trace: (obj: unknown, msg?: string) => msg 
    ? logger.trace(msg, obj)
    : logger.trace(obj),

  silent: (obj: unknown, msg?: string) => msg 
    ? logger.trace(msg, obj)
    : logger.trace(obj),

  child: (bindings: Record<string, unknown>, options?: ChildLoggerOptions): FastifyBaseLogger => {
    if (options) throw new Error("Child logger options are not supported", {cause: options});
    return winstonLogger(logger.child(bindings));  
  },
});

export const createServer = async(): Promise<FastifyServer> => {
  const server: FastifyServer = fastify({
    logger: winstonLogger(defaultLogger),
  });

  try {
    /**
     * Register Routes
     */
    await server.register(healthcheck, {prefix: "/api"});
  
    server.after((err: Error | null) => {
      if (err) {
        defaultLogger.error("Handle errors after middleware", err, () => {
          exit(1); 
        });
      }
    });
    server.ready((err: Error | null) => {
      if (err) {
        defaultLogger.error("Handle errors ready middleware", err, () => {
          exit(1);
        });
      }
    });
    
    return server;
  }
  catch (error) {
    defaultLogger.error("Failed to init server, exiting", error, () => {
      exit(1);
    });
    return exit(1);
  }
};