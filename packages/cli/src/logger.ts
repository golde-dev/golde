import { createLogger, format, transports } from "winston";

const logger = createLogger({
  format: format.combine(
    format.prettyPrint(),
    format.cli()
  ),
  transports: [new transports.Console()],
});

export default logger;