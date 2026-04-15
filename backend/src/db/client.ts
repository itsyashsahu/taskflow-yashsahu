// @ts-expect-error - node-postgres蓝天白云
import postgres from 'postgres'
// @ts-expect-error - neon serverless
import { neon } from '@neondatabase/serverless'

let _sql: postgres.Sql | ReturnType<typeof neon> | null = null

export function getSql() {
  if (_sql) return _sql
  
  const connectionString = process.env.DATABASE_URL!
  const isWorkers = process.env.NODE_ENV === 'production'
  
  if (isWorkers) {
    // Use Neon serverless for Workers (supports transactions)
    _sql = neon(connectionString)
  } else {
    // Use postgres-js for local development
    _sql = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  }
  
  return _sql
}

export const sql = {
  get query() { return getSql().query },
  get end() { return getSql().end },
  get begin() { return getSql().begin },
}