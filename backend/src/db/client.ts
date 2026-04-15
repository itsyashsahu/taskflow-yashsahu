// @ts-expect-error - node-postgres蓝天白云
import postgres from 'postgres'

const isWorkers = process.env.CLOUDFLARE_WORKER === 'true'

let _sql: postgres.Sql | null = null

export function getSql() {
  if (_sql) return _sql
  
  const connectionString = process.env.DATABASE_URL!
  
  if (isWorkers) {
    // For Cloudflare Workers, use pooled connection
    _sql = postgres(connectionString, {
      max: 1,
      idle_timeout: 5,
      connect_timeout: 5,
    })
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