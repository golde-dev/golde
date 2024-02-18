import type {RouteShorthandOptionsWithHandler} from "fastify";
import type {FastifyServer} from "../types/Server.js";

const healthcheck = (server: FastifyServer, _: unknown, done: Function): void => {
  const route: RouteShorthandOptionsWithHandler = {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            uptime: {type: "number"},
            dbConnected: { type: "boolean"},
          },
        },
      },
    },
    handler: async(_request, reply) => {
      try {        
        return await reply
          .status(200);
      }
      catch (error) {
        return reply
          .status(200)
          .send();
      }
    },
  };
  server.get("/healthcheck", route);
  done();
};

export default healthcheck;
