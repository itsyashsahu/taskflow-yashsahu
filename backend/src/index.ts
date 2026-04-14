import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { sql } from "./db/client.js"
import { baseLog, getRequestLogger } from "./lib/logger.js"
import { requestIdMiddleware } from "./middleware/request-id.js";
import { loggerMiddleware } from "./middleware/logger.js";
import { transactionMiddleware } from "./middleware/transaction.js";
import { requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import userRoutes from "./routes/users.js";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));

app.use("*", requestIdMiddleware);
app.use("*", loggerMiddleware);
app.use("*", transactionMiddleware);
app.use("*", cors());

app.use("/projects/*", requireAuth);
app.use("/tasks/*", requireAuth);
app.use("/users/*", requireAuth);

app.route("/auth", authRoutes);
app.route("/projects", projectRoutes);
app.route("/tasks", taskRoutes);
app.route("/users", userRoutes);

app.notFound((c) => {
  const reqLog = getRequestLogger(c.get("requestId"));
  reqLog.warn("route not found");
  return c.json({ error: "not found" }, 404);
});

app.onError((err, c) => {
  const reqLog = getRequestLogger(c.get("requestId"));
  reqLog.error({ err }, "unhandled error");
  return c.json({ 
    error: "internal server error",
    requestId: c.get("requestId")
  }, 500);
});

const port = Number(process.env.PORT) || 3001;
baseLog.info(`TaskFlow API starting on port ${port}`);

const server = serve({ fetch: app.fetch, port });

process.on("SIGTERM", () => {
  baseLog.info("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await sql.end();
    baseLog.info("Server closed");
    process.exit(0);
  });
});