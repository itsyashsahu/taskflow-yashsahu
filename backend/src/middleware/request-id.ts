import { createMiddleware } from "hono/factory"
import { randomUUID } from "node:crypto"

import type { RequestIdVariables } from "../lib/context.js"

export const requestIdMiddleware = createMiddleware<{ Variables: RequestIdVariables }>(async (c, next) => {
  const incomingId = c.req.header("x-request-id")
  const requestId = incomingId || randomUUID()

  c.set("requestId", requestId)
  c.header("x-request-id", requestId)
  await next()
})