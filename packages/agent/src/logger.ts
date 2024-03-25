import config from "./config.js";
import type { LeveledLogMethod, Logger} from "winston";
import { createLogger, format, transports } from "winston";

const {
  API_LOG_PRETTY,
} = config;

const levels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  trace: 4,
  debug: 5,
};

export type CustomLogger = Logger & Record<keyof typeof levels, LeveledLogMethod>;

export default API_LOG_PRETTY 
  ? createLogger({
    levels,
    level: "info",
    format: format.combine(
      format.colorize(),
      format.prettyPrint()
    ),
    transports: [new transports.Console()],
  }) as CustomLogger
  : createLogger({
    levels,
    level: "info",
    format: format.combine(
      format.json()
    ),
    transports: [new transports.Console()],
  }) as CustomLogger;
