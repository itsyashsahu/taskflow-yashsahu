import { createMiddleware } from "hono/factory"

import { sql } from "../db/client.js"
import { getRequestLogger } from "../lib/logger.js"
import type { AppVariables } from "../lib/context.js"

export const transactionMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const reqLog = getRequestLogger(c.get("requestId"))

    if (c.req.method === "GET") {
      c.set("db", sql)
      await next()
      return
    }

    try {
      await sql.begin(async (tx) => {
        c.set("db", tx)
        await next()
      })
    } catch (err) {
      reqLog.error({ err }, "transaction rolled back")
      throw err
    }
  }
)