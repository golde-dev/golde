import type {DestinationStream} from "pino";
import { pino, transport} from "pino";
import config from "./config.js";

const {
  API_LOG_PRETTY,
} = config;

const transportPretty = transport({
  targets: [
    {  target: "pino-pretty",  options: { colorize: true }},
  ],
}) as DestinationStream;

export default API_LOG_PRETTY
  ? pino(transportPretty)
  : pino();
