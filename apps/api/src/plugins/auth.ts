import { clerkClient } from "@clerk/backend"
import fp from "fastify-plugin"

export const clerkPlugin = fp(async function (fastify) {
  fastify.decorateRequest("user", null)
  fastify.decorateRequest("subscription", null)

  fastify.addHook("onRequest", async (request) => {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return
    }

    const token = authHeader.slice(7)

    try {
      const session = await clerkClient.sessions.verifySession(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      })

      if (!session) {
        return
      }

      const user = await clerkClient.users.getUser(session.userId)

      request.user = {
        id: user.id,
        clerkUserId: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? "",
        name: user.fullName ?? "",
        avatarUrl: user.imageUrl,
      }

      const subscription = await clerkClient.subscriptions.getSubscription(
        user.id,
        { secretKey: process.env.CLERK_SECRET_KEY! }
      ).catch(() => null)

      request.subscription = subscription ?? {
        tier: "free",
        active: true,
      }
    } catch (err) {
      fastify.log.error(err, "Auth verification failed")
      return
    }
  })
})