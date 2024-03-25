import { createLogger, format, transports } from "winston";

const logger = createLogger({
  format: format.combine(
    format.prettyPrint()
  ),
  transports: [new transports.Console()],
});

export default logger;