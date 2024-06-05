import { Hono } from "hono";
import {healthcheck} from "./routes/healthcheck.ts";

export const createServer = (): Hono => {
  const server = new Hono();

  server.get("/healthcheck", healthcheck);

  return server;
};
