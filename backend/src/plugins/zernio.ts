import { Zernio } from "@zernio/node"
import fp from "fastify-plugin"

export const zernioPlugin = fp(async function (fastify) {
  const zernio = new Zernio({
    apiKey: process.env.ZERNIO_API_KEY!,
  })

  fastify.decorate("zernio", zernio)
})