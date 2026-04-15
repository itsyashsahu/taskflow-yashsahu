import { Hono } from "hono"
import { z } from "zod"

import type { AppVariables } from "../lib/context.js"
import { projectsRepository } from "../repositories/projects.repository.js"
import { tasksRepository } from "../repositories/tasks.repository.js"
import { parseBody } from "../lib/validate.js"

const tasks = new Hono<{ Variables: AppVariables }>()

const taskStatusEnum = z.enum(['todo', 'in_progress', 'done'])
const taskPriorityEnum = z.enum(['low', 'medium', 'high'])

const createTaskSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
})

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
})

// GET /:id/tasks (mounted at /projects)
tasks.get("/:id/tasks", async (c) => {
  const { id } = c.req.param()
  const { status, assignee } = c.req.query()

  try {
    const project = await projectsRepository.getById(c.get("db"), id)
    if (!project) return c.json({ error: 'not found' }, 404)

    const rows = await tasksRepository.listForProject(c.get("db"), id, {
      status,
      assignee,
    })

    return c.json({ tasks: rows })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// POST /:id/tasks (mounted at /projects)
tasks.post("/:id/tasks", async (c) => {
  const { id } = c.req.param()
  const { data, error } = await parseBody(c, createTaskSchema)
  if (error) return c.json(error, 400)

  try {
    const project = await projectsRepository.getById(c.get("db"), id)
    if (!project) return c.json({ error: 'not found' }, 404)

    const task = await tasksRepository.create(c.get("db"), id, {
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      priority: data.priority,
      assignee_id: data.assignee_id ?? null,
      due_date: data.due_date ?? null,
    })
    return c.json({ task }, 201)
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// PATCH /:id (for updating single task)
tasks.patch("/:id", async (c) => {
  const { id } = c.req.param()
  const { data, error } = await parseBody(c, updateTaskSchema)
  if (error) return c.json(error, 400)

  try {
    const task = await tasksRepository.getById(c.get("db"), id)
    if (!task) return c.json({ error: 'not found' }, 404)

    const updates: {
      title?: string
      description?: string | null
      status?: "todo" | "in_progress" | "done"
      priority?: "low" | "medium" | "high"
      assignee_id?: string | null
      due_date?: string | null
      updated_at?: Date
    } = { updated_at: new Date() }
    if (data.title !== undefined) updates.title = data.title
    if (data.description !== undefined) updates.description = data.description
    if (data.status !== undefined) updates.status = data.status
    if (data.priority !== undefined) updates.priority = data.priority
    if (data.assignee_id !== undefined) updates.assignee_id = data.assignee_id
    if (data.due_date !== undefined) updates.due_date = data.due_date

    const updated = await tasksRepository.update(c.get("db"), id, updates)
    return c.json({ task: updated })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// DELETE /tasks/:id — only project owner OR task assignee
tasks.delete("/:id", async (c) => {
  const userId = c.get("userId")
  const { id } = c.req.param()

  try {
    const task = await tasksRepository.getForDeletion(c.get("db"), id)
    if (!task) return c.json({ error: 'not found' }, 404)
    if (task.owner_id !== userId && task.assignee_id !== userId) {
      return c.json({ error: 'forbidden' }, 403)
    }

    await tasksRepository.delete(c.get("db"), id)
    return new Response(null, { status: 204 })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

export default tasks
