import { Context } from "hono";

const healthcheck = (c: Context) => {
  return c.json({ status: "ok" });
};

export default healthcheck;
