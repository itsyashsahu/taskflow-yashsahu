import { createMiddleware } from "hono/factory"
import { verify } from "hono/jwt"

import type { AuthVariables } from "../lib/context.js"

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const authHeader = c.req.header("Authorization")
    const queryToken = c.req.query("token")

    let token: string | undefined

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7)
    } else if (queryToken) {
      token = queryToken
    }

    if (!token) {
      return c.json({ error: "unauthorized" }, 401)
    }

    try {
      const payload = await verify(token, process.env.JWT_SECRET!, "HS256")
      c.set("userId", payload["user_id"] as string)
      c.set("userEmail", payload["email"] as string)
      await next()
    } catch {
      return c.json({ error: "unauthorized" }, 401)
    }
  },
)
