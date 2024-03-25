import { createLogger, format, transports } from "winston";

const logger = createLogger({
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.align(),
    format.printf(({timestamp, level, message, ...rest}) => {
      return `${timestamp} ${level}: ${message} ${JSON.stringify(rest, null, 2)}`;
    })
  ),
  transports: [new transports.Console()],
});

export default logger;