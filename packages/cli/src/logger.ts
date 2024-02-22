
import type { DestinationStream} from "pino";
import { pino, transport} from "pino";

const transportPretty = transport({
  targets: [
    {  
      target: "pino-pretty",
      options: { 
        colorize: true, 
      },
    },
  ],
}) as DestinationStream;

export default pino({errorKey: "error"}, transportPretty);