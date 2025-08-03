import { pino } from "pino";
import pretty from "pino-pretty";

const prettyLogger = pino(pretty());
const jsonLogger = pino();

function prettyTable(data: unknown[], title: string) {
  prettyLogger.info(title);
  console.table(data);
}

function jsonTable(data: unknown[], title: string) {
  jsonLogger.info(title);
  console.table(data);
}

type LoggerFn = (metaOrMessage: unknown | string, message?: string) => void;

export const logger = {
  info: prettyLogger.info.bind(prettyLogger) as LoggerFn,
  error: prettyLogger.error.bind(prettyLogger) as LoggerFn,
  debug: prettyLogger.debug.bind(prettyLogger) as LoggerFn,
  warn: prettyLogger.warn.bind(prettyLogger) as LoggerFn,
  table: prettyTable,
  level: "info",
  configure(level: string, json: boolean = false) {
    this.level = level;
    if (json) {
      jsonLogger.level = level;
      this.info = jsonLogger.info.bind(jsonLogger);
      this.error = jsonLogger.error.bind(jsonLogger);
      this.debug = jsonLogger.debug.bind(jsonLogger);
      this.warn = jsonLogger.warn.bind(jsonLogger);
      this.table = jsonTable;
    } else {
      prettyLogger.level = level;
      this.info = prettyLogger.info.bind(prettyLogger);
      this.error = prettyLogger.error.bind(prettyLogger);
      this.debug = prettyLogger.debug.bind(prettyLogger);
      this.warn = prettyLogger.warn.bind(prettyLogger);
      this.table = prettyTable;
    }
  },
};

export type Logger = typeof logger;
