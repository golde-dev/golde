import {
  ConsoleHandler,
  debug,
  error,
  formatters,
  getLevelName,
  info,
  setup,
  warn,
  type LogLevel,
  type LogRecord,
  type LevelName,
} from "@std/log";

const {
  jsonFormatter,
} = formatters;

function prettyFormatter(logRecord: LogRecord) {
  const { msg, args, level } = logRecord;
  return `${getLevelName(level as LogLevel)} | ${msg} ${
    args.map((arg: unknown) => JSON.stringify(arg, null, 2)).join(" ")
  }`;
}

function configure(level: LevelName, pretty: boolean = false): void {
  setup({
    handlers: {
      default: new ConsoleHandler(level, {
        formatter: pretty ? prettyFormatter : jsonFormatter,
        useColors: false,
      }),
    },
  });
}

configure("INFO");
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
  configure,
  info,
  error,
  debug,
  warn,
};

export type Logger = typeof logger;
