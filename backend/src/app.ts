import { Hono } from "hono"
import { cors } from "hono/cors"

import type { AppVariables } from "./lib/context.js"
import { requireAuth } from "./middleware/auth.js"
import { loggerMiddleware } from "./middleware/logger.js"
import { requestIdMiddleware } from "./middleware/request-id.js"
import { transactionMiddleware } from "./middleware/transaction.js"
import authRoutes from "./routes/auth.js"
import projectRoutes from "./routes/projects.js"
import taskRoutes from "./routes/tasks.js"
import userRoutes from "./routes/users.js"

export const app = new Hono<{ Variables: AppVariables }>()

app.get("/health", (c) => c.json({ status: "ok" }))

app.use("*", requestIdMiddleware)
app.use("*", loggerMiddleware)
app.use("*", transactionMiddleware)
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}))

app.use("/projects/*", requireAuth)
app.use("/tasks/*", requireAuth)
app.use("/users/*", requireAuth)

app.route("/auth", authRoutes)
app.route("/projects", projectRoutes)
app.route("/projects", taskRoutes) // tasks mounted under /projects (e.g., /projects/:id/tasks)
app.route("/tasks", taskRoutes) // tasks mounted under /tasks/:id for update/delete
app.route("/users", userRoutes)

app.notFound((c) => c.json({ error: "not found" }, 404))

app.onError((err, c) => {
  console.error(err)
  return c.json(
    {
      error: "internal server error",
      requestId: c.get("requestId"),
    },
    500
  )
})

export type AppType = typeof app
export type AppSchema = AppType extends Hono<any, infer Schema, any> ? Schema : never