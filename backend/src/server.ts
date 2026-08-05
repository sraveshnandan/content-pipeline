import Fastify from "fastify"
import cors from "@fastify/cors"
import env from "@fastify/env"
import { config } from "dotenv"

import { dbPlugin } from "./plugins/db.js"
import { redisPlugin } from "./plugins/redis.js"
import { clerkPlugin } from "./plugins/auth.js"
import { zernioPlugin } from "./plugins/zernio.js"

config({ path: ".env.local" })

async function build() {
  const app = Fastify({ logger: true })

  app.register(cors, {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })

  app.register(env, {
    schema: {
      type: "object",
      required: ["DATABASE_URL", "REDIS_URL"],
      properties: {
        DATABASE_URL: { type: "string" },
        REDIS_URL: { type: "string" },
        CLERK_SECRET_KEY: { type: "string" },
        ZERNIO_API_KEY: { type: "string" },
        GROQ_API_KEY: { type: "string" },
        GEMINI_API_KEY: { type: "string" },
        INNGEST_SIGNING_KEY: { type: "string" },
        INNGEST_EVENT_KEY: { type: "string" },
      },
    },
  })

  app.register(dbPlugin)
  app.register(redisPlugin)
  app.register(clerkPlugin)
  app.register(zernioPlugin)

  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() }
  })

  return app
}

async function start() {
  const app = await build()
  try {
    await app.listen({
      port: Number(process.env.PORT) || 4000,
      host: "0.0.0.0",
    })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()