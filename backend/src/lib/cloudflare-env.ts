type CloudflareBindings = {
  DATABASE_URL: string
  JWT_SECRET: string
  NODE_ENV: string
  BACKEND_URL: string
}

export function getCloudflareBindings(env: unknown): Record<string, string> {
  const bindings = env as CloudflareBindings
  const result: Record<string, string> = {}
  
  if (bindings.DATABASE_URL) {
    result.DATABASE_URL = bindings.DATABASE_URL
  }
  if (bindings.JWT_SECRET) {
    result.JWT_SECRET = bindings.JWT_SECRET
  }
  if (bindings.NODE_ENV) {
    result.NODE_ENV = bindings.NODE_ENV
  }
  if (bindings.BACKEND_URL) {
    result.BACKEND_URL = bindings.BACKEND_URL
  }
  
  return result
}