import { createMiddleware } from "hono/factory";
import { randomUUID } from "crypto";
import type { RequestIdVariables } from "../types.js";

export const requestIdMiddleware = createMiddleware<{ Variables: RequestIdVariables }>(async (c, next) => {
  const incomingId = c.req.header("x-request-id");
  const requestId = incomingId || randomUUID();
  
  c.set("requestId", requestId);
  await next();
});