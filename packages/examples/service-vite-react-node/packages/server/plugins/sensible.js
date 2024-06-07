/* eslint-disable @typescript-eslint/no-var-requires */

const fp = require('fastify-plugin');
const sensible = require('@fastify/sensible');

/**
 * This plugins adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
module.exports = fp(async function (fastify) {
  fastify.register(sensible, {
    errorHandler: false
  });
});
