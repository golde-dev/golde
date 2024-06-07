
module.exports = async function (fastify) {
  fastify.get('/api', async function () {
    return { message: "hello from fastify server" }
  })
}
