import { getCloudflareBindings } from "./lib/cloudflare-env"
import { app } from "./app"

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    // @ts-ignore - Cloudflare bindings
    Object.assign(process.env, getCloudflareBindings(env))
    return app.fetch(request, ctx)
  }
}