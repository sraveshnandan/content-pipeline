import Redis from "ioredis"
import fp from "fastify-plugin"

export const redisPlugin = fp(async function (fastify) {
  const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      return Math.min(times * 100, 3000)
    },
  })

  redis.on("error", (err) => {
    fastify.log.error(err, "Redis connection error")
  })

  redis.on("connect", () => {
    fastify.log.info("Redis connected")
  })

  fastify.decorate("redis", redis)

  fastify.addHook("onClose", async () => {
    await redis.quit()
  })
})