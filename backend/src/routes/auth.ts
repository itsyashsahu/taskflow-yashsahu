import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { z } from 'zod'
import { sql } from '../db/client.js'
import { comparePassword, hashPassword } from '../lib/hash.js'
import { parseBody } from '../lib/validate.js'

const auth = new Hono()

const registerSchema = z.object({
  name: z.string().min(1, 'name is required'),
  email: z.string().email('invalid email format'),
  password: z.string().min(8, 'password must be at least 8 characters'),
})

const loginSchema = z.object({
  email: z.string().email('invalid email format'),
  password: z.string().min(1, 'password is required'),
})

// POST /auth/register
auth.post('/register', async (c) => {
  const { data, error } = await parseBody(c, registerSchema)
  if (error) return c.json(error, 400)

  try {
    // Check if email already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${data.email}`
    if (existing.length > 0) {
      return c.json({ error: 'email already in use' }, 400)
    }

    const hashedPassword = await hashPassword(data.password)

    const [user] = await sql`
      INSERT INTO users (name, email, password)
      VALUES (${data.name}, ${data.email}, ${hashedPassword})
      RETURNING id, name, email, created_at
    `

    const token = await sign(
      {
        user_id: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 86400,
      },
      process.env.JWT_SECRET!
    )

    return c.json({ token, user }, 201)
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// POST /auth/login
auth.post('/login', async (c) => {
  const { data, error } = await parseBody(c, loginSchema)
  if (error) return c.json(error, 400)

  try {
    const [user] = await sql`
      SELECT id, name, email, password, created_at
      FROM users
      WHERE email = ${data.email}
    `

    if (!user) {
      return c.json({ error: 'unauthorized' }, 401)
    }

    const valid = await comparePassword(data.password, user.password)
    if (!valid) {
      return c.json({ error: 'unauthorized' }, 401)
    }

    const token = await sign(
      {
        user_id: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 86400,
      },
      process.env.JWT_SECRET!
    )

    const { password: _pw, ...safeUser } = user
    return c.json({ token, user: safeUser })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

export default auth
