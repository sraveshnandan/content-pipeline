import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import fp from "fastify-plugin"

export const dbPlugin = fp(async function (fastify) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const db = drizzle(pool)

  fastify.decorate("db", db)

  fastify.addHook("onClose", async () => {
    await pool.end()
  })
})