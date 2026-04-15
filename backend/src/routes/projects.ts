import { Hono } from "hono"
import { z } from "zod"

import type { AppVariables } from "../lib/context.js"
import { projectsRepository } from "../repositories/projects.repository.js"
import { parseBody } from "../lib/validate.js"

const projects = new Hono<{ Variables: AppVariables }>()

const createProjectSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
})

// GET /projects — projects owned by or assigned to current user, with task counts
projects.get("/", async (c) => {
  const userId = c.get("userId")
  try {
    const rows = await projectsRepository.listForUser(c.get("db"), userId)
    return c.json({ projects: rows })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// POST /projects
projects.post("/", async (c) => {
  const userId = c.get("userId")
  const { data, error } = await parseBody(c, createProjectSchema)
  if (error) return c.json(error, 400)

  try {
    const project = await projectsRepository.create(
      c.get("db"),
      { name: data.name, description: data.description ?? null },
      userId
    )
    return c.json({ project }, 201)
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// GET /projects/:id — project with all its tasks
projects.get("/:id", async (c) => {
  const { id } = c.req.param()
  try {
    const project = await projectsRepository.getWithTasks(c.get("db"), id)
    if (!project) return c.json({ error: 'not found' }, 404)

    return c.json({ project })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// PATCH /projects/:id
projects.patch("/:id", async (c) => {
  const userId = c.get("userId")
  const { id } = c.req.param()
  const { data, error } = await parseBody(c, updateProjectSchema)
  if (error) return c.json(error, 400)

  try {
    const project = await projectsRepository.getOwner(c.get("db"), id)
    if (!project) return c.json({ error: 'not found' }, 404)
    if (project.owner_id !== userId) return c.json({ error: 'forbidden' }, 403)

    const updates: { name?: string; description?: string | null } = {}
    if (data.name !== undefined) updates.name = data.name
    if (data.description !== undefined) updates.description = data.description

    if (Object.keys(updates).length === 0) {
      const current = await projectsRepository.getById(c.get("db"), id)
      return c.json({ project: current })
    }

    const updated = await projectsRepository.update(c.get("db"), id, updates)
    return c.json({ project: updated })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// DELETE /projects/:id
projects.delete("/:id", async (c) => {
  const userId = c.get("userId")
  const { id } = c.req.param()

  try {
    const project = await projectsRepository.getOwner(c.get("db"), id)
    if (!project) return c.json({ error: 'not found' }, 404)
    if (project.owner_id !== userId) return c.json({ error: 'forbidden' }, 403)

    await projectsRepository.delete(c.get("db"), id)
    return new Response(null, { status: 204 })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// GET /projects/:id/stats
projects.get("/:id/stats", async (c) => {
  const { id } = c.req.param()

  try {
    const project = await projectsRepository.getById(c.get("db"), id)
    if (!project) return c.json({ error: 'not found' }, 404)

    const { counts, byAssignee } = await projectsRepository.getStats(c.get("db"), id)

    return c.json({
      total: Number(counts.total),
      by_status: {
        todo: Number(counts.todo),
        in_progress: Number(counts.in_progress),
        done: Number(counts.done),
      },
      by_assignee: byAssignee.map((r) => ({
        user_id: r.user_id,
        name: r.name,
        count: Number(r.count),
      })),
    })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

export default projects
