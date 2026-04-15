import { Hono } from "hono"
import { sign } from "hono/jwt"
import { z } from "zod"

import type { AppVariables } from "../lib/context.js"
import { comparePassword, hashPassword } from "../lib/hash.js"
import { authRepository } from "../repositories/auth.repository.js"
import { parseBody } from "../lib/validate.js"

const auth = new Hono<{ Variables: AppVariables }>()

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
    const db = c.get("db")
    const existing = await authRepository.findUserByEmail(db, data.email)
    if (existing) {
      return c.json({ error: 'email already in use' }, 400)
    }

    const hashedPassword = await hashPassword(data.password)

    const user = await authRepository.createUser(
      db,
      data.name,
      data.email,
      hashedPassword
    )

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
    const db = c.get("db")
    const user = await authRepository.findUserByEmail(db, data.email)

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
