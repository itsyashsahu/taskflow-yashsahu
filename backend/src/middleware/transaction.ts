import { createMiddleware } from "hono/factory";
import { sql } from "../db/client.js";
import { getRequestLogger } from "../lib/logger.js";

export const transactionMiddleware = createMiddleware(async (c, next) => {
  const method = c.req.method;
  
  if (method === "GET") {
    await next();
    return;
  }

  const reqLog = getRequestLogger(c.get("requestId"));

  try {
    await sql.begin(async (tx) => {
      c.set("db", tx);
      await next();
    });
  } catch (err) {
    reqLog.error({ err }, "transaction rolled back");
    throw err;
  }
});

export const getDb = (c: any) => c.get("db") || sql;