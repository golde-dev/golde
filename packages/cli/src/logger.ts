import {
  ConsoleHandler,
  debug,
  error,
  formatters,
  getLevelName,
  info,
  setup,
  warn,
} from "@std/log";

import type { LevelName, LogLevel, LogRecord } from "@std/log";

const {
  jsonFormatter,
} = formatters;

function prettyFormatter(logRecord: LogRecord) {
  const { msg, args, level } = logRecord;
  return `${getLevelName(level as LogLevel).padEnd(5)}| ${msg} ${
    args.map((arg: unknown) => JSON.stringify(arg, null, 2)).join(" ")
  }`;
}

export function configure(level: LevelName, jsonFormat: boolean = false): void {
  setup({
    handlers: {
      default: new ConsoleHandler(level, {
        formatter: jsonFormat ? jsonFormatter : prettyFormatter,
        useColors: false,
      }),
    },
    loggers: {
      default: {
        level,
        handlers: ["default"],
      },
    },
  });
}

configure("INFO");

export const logger = {
  configure,
  info,
  error,
  debug,
  warn,
};

export type Logger = typeof logger;
