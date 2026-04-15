import { sql } from "../db/client.js"

export type Database = typeof sql

export interface AuthVariables {
  userId: string
  userEmail: string
}

export interface RequestIdVariables {
  requestId: string
}

export interface DbVariables {
  db: Database
}

export type AppVariables = AuthVariables & RequestIdVariables & DbVariables