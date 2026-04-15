import { Hono } from "hono"
import { z } from "zod"

import type { AppVariables } from "../lib/context.js"
import { usersRepository } from "../repositories/users.repository.js"
import { parseBody } from "../lib/validate.js"

const users = new Hono<{ Variables: AppVariables }>()

const themeSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
})

// GET /users — all users with aggregated task counts (never returns password)
users.get("/", async (c) => {
  try {
    const rows = await usersRepository.list(c.get("db"))
    return c.json({ users: rows })
  } catch (err) {
    console.error(err)
    return c.json({ error: "internal server error" }, 500)
  }
})

// GET /users/:id/tasks — tasks assigned to a specific user, grouped by project
users.get("/:id/tasks", async (c) => {
  const { id } = c.req.param()

  try {
    const user = await usersRepository.getById(c.get("db"), id)
    if (!user) return c.json({ error: "not found" }, 404)

    const projects = await usersRepository.listAssignedTasks(c.get("db"), id)

    return c.json({
      user,
      projects,
    })
  } catch (err) {
    console.error(err)
    return c.json({ error: "internal server error" }, 500)
  }
})

// PATCH /users/theme — update user theme preference
users.patch("/theme", async (c) => {
  const userId = c.get("userId")
  const { data, error } = await parseBody(c, themeSchema)
  if (error) return c.json(error, 400)

  try {
    const updated = await usersRepository.updateTheme(c.get("db"), userId, data.theme)
    if (!updated) return c.json({ error: "not found" }, 404)

    return c.json({ user: updated })
  } catch (err) {
    console.error(err)
    return c.json({ error: "internal server error" }, 500)
  }
})

// GET /users/me — get current user with theme preference
users.get("/me", async (c) => {
  const userId = c.get("userId")

  try {
    const user = await usersRepository.getById(c.get("db"), userId)
    if (!user) return c.json({ error: "not found" }, 404)

    return c.json({ user })
  } catch (err) {
    console.error(err)
    return c.json({ error: "internal server error" }, 500)
  }
})

export default users
