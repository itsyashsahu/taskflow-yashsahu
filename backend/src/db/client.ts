import postgres from "postgres"

function isCloudflareWorkersRuntime(): boolean {
  return (
    (typeof process !== "undefined" && process.env?.CLOUDFLARE_WORKER === "true") ||
    (typeof globalThis === "object" && "WebSocketPair" in globalThis)
  )
}

let _sql: ReturnType<typeof postgres> | null = null

export function getDb() {
  if (_sql) return _sql
  
  const connectionString = process.env.DATABASE_URL!
  
  // Use minimal pool for Workers to avoid connection exhaustion
  const poolSize = isCloudflareWorkersRuntime() ? 1 : 10
  
  _sql = postgres(connectionString, {
    max: poolSize,
    idle_timeout: isCloudflareWorkersRuntime() ? 5 : 20,
    connect_timeout: 10,
  })
  
  return _sql
}

export const sql = {
  get query() { return getDb().query },
  get end() { return getDb().end },
}