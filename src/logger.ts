/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type {DestinationStream} from "pino";
import { pino, transport} from "pino";
import config from "./config.js";


const {
  LOGTAIL_TOKEN, 
} = config;

const transportLog = transport({
  target: "@logtail/pino",
  options: { sourceToken: LOGTAIL_TOKEN },
}) as DestinationStream;


export default pino(transportLog);