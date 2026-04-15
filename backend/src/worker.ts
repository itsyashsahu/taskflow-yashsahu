import { app } from "./app"

interface WorkerEnv {
  [key: string]: unknown
}

function toStringRecord(input: WorkerEnv): Record<string, string> {
  return Object.entries(input).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === "string") {
      acc[key] = value
    }
    return acc
  }, {})
}

export default {
  async fetch(request: Request, env: WorkerEnv, executionCtx: ExecutionContext) {
    const runtimeEnv = toStringRecord(env)

    // Set Cloudflare Worker flag and inject env vars
    if (typeof process !== "undefined" && process.env) {
      Object.assign(process.env, runtimeEnv, {
        CLOUDFLARE_WORKER: "true",
      })
    }

    return app.fetch(request, executionCtx)
  },
}