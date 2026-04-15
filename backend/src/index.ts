import { serve } from "@hono/node-server"

import { app } from "./app.js"
import { sql } from "./db/client.js"
import { baseLog } from "./lib/logger.js"

const port = Number(process.env.PORT) || 3001
baseLog.info(`TaskFlow API starting on port ${port}`)

const server = serve({ fetch: app.fetch, port })

process.on("SIGTERM", () => {
  baseLog.info("SIGTERM received, shutting down gracefully")
  server.close(async () => {
    await sql.end()
    baseLog.info("Server closed")
    process.exit(0)
  })
})