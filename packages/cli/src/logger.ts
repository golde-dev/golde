/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DestinationStream, LoggerOptions} from "pino";
import { pino, transport, stdSerializers} from "pino";

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

/**
 * Users of CLI do not care about stacktraces
 * Include cause that is not another error, pino already handle error causes
 */
const errorSerializer = (error: Error) => {
  const {stack, ...rest} = stdSerializers.err(error);

  const {
    cause,
  } = error;

  if (cause instanceof Error) {
    return {
      ...rest,
    };
  }
  else {
    return {
      ...rest,
      cause,
    };
  }
};

const options: LoggerOptions = {
  errorKey: "error", 
  serializers: {
    err: errorSerializer,
  },
};

export default pino(options, transportPretty);