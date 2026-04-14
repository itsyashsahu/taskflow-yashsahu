import type { Context } from "hono";

export interface AuthVariables {
  userId: string;
  userEmail: string;
}

export interface RequestIdVariables {
  requestId: string;
}

export type Variables = AuthVariables & RequestIdVariables;