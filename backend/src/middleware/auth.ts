import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

export type AuthVariables = {
  userId: string;
  userEmail: string;
};

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const token = authHeader.slice(7);
    try {
      const payload = await verify(token, process.env.JWT_SECRET!, "HS256");
      c.set("userId", payload["user_id"] as string);
      c.set("userEmail", payload["email"] as string);
      await next();
    } catch {
      return c.json({ error: "unauthorized" }, 401);
    }
  },
);
