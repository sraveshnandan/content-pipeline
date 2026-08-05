import Redis from "ioredis"
import fp from "fastify-plugin"

export const redisPlugin = fp(async function (fastify) {
  let redis: Redis | null = null

  try {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
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

    await redis.connect()
    fastify.decorate("redis", redis)
  } catch (err) {
    fastify.log.warn(err, "Redis connection failed, continuing without cache")
    fastify.decorate("redis", null)
  }

  fastify.addHook("onClose", async () => {
    if (redis) {
      try {
        await redis.quit()
      } catch {
        // ignore
      }
    }
  })
})