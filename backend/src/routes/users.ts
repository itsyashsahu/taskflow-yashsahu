import { Hono } from "hono"

import type { AppVariables } from "../lib/context.js"
import { usersRepository } from "../repositories/users.repository.js"

const users = new Hono<{ Variables: AppVariables }>()

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

export default users
