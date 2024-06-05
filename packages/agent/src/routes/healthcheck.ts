import { Context } from "hono";

export const healthcheck = (c: Context) => {
  return c.json({ status: "ok" });
};
