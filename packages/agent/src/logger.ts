import {
  ConsoleHandler,
  debug,
  error,
  formatters,
  info,
  LevelName,
  setup,
  warn,
} from "@std/log";

function setLevel(level: LevelName): void {
  setup({
    handlers: {
      default: new ConsoleHandler(level, {
        formatter: formatters.jsonFormatter,
        useColors: false,
      }),
    },
  });
}

setLevel("INFO");

export const logger = {
  info,
  error,
  debug,
  warn,
};

export type Logger = typeof logger;
