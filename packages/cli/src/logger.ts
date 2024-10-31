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

let level: LevelName = "INFO";

export function configure(newLevel: LevelName, jsonFormat: boolean = false): void {
  level = newLevel;
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

configure(level);

export const logger = {
  configure,
  info,
  error,
  debug,
  warn,
  get level() {
    return level;
  },
};

export type Logger = typeof logger;
