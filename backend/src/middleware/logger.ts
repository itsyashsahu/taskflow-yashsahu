import { createMiddleware } from "hono/factory";
import { getRequestLogger, setCurrentRequestId } from "../lib/logger.js";

export const loggerMiddleware = createMiddleware(async (c, next) => {
  const requestId = c.get("requestId");
  
  setCurrentRequestId(requestId);
  const reqLog = getRequestLogger(requestId);

  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  const status = c.res.status || 500;
  const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
  
  reqLog[level]({
    requestId,
    method: c.req.method,
    path: c.req.path,
    status,
    duration,
  }, "request completed");
});