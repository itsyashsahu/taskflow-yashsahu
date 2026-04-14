import type { Context } from 'hono'
import type { ZodSchema } from 'zod'

export const parseBody = async <T>(c: Context, schema: ZodSchema<T>) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return {
      data: null,
      error: { error: 'validation failed', fields: { body: 'invalid JSON' } },
    }
  }
  const result = schema.safeParse(body)
  if (!result.success) {
    const fields: Record<string, string> = {}
    result.error.errors.forEach((e) => {
      fields[e.path.join('.')] = e.message
    })
    return { data: null, error: { error: 'validation failed', fields } }
  }
  return { data: result.data, error: null }
}
