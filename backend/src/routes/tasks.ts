import { Hono } from 'hono'
import { z } from 'zod'
import { sql } from '../db/client.js'
import type { AuthVariables } from '../middleware/auth.js'
import { parseBody } from '../lib/validate.js'

const tasks = new Hono<{ Variables: AuthVariables }>()

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

// GET /projects/:id/tasks
tasks.get('/projects/:id/tasks', async (c) => {
  const { id } = c.req.param()
  const { status, assignee } = c.req.query()

  try {
    const [project] = await sql`SELECT id FROM projects WHERE id = ${id}`
    if (!project) return c.json({ error: 'not found' }, 404)

    const rows = await sql`
      SELECT
        t.id, t.title, t.description, t.status, t.priority,
        t.project_id, t.assignee_id, t.due_date, t.created_at, t.updated_at,
        u.name AS assignee_name, u.email AS assignee_email
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      WHERE t.project_id = ${id}
        ${status ? sql`AND t.status = ${status}::task_status` : sql``}
        ${assignee ? sql`AND t.assignee_id = ${assignee}` : sql``}
      ORDER BY t.created_at ASC
    `

    return c.json({ tasks: rows })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// POST /projects/:id/tasks
tasks.post('/projects/:id/tasks', async (c) => {
  const { id } = c.req.param()
  const { data, error } = await parseBody(c, createTaskSchema)
  if (error) return c.json(error, 400)

  try {
    const [project] = await sql`SELECT id FROM projects WHERE id = ${id}`
    if (!project) return c.json({ error: 'not found' }, 404)

    const [task] = await sql`
      INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, due_date)
      VALUES (
        ${data.title},
        ${data.description ?? null},
        ${data.status ?? 'todo'},
        ${data.priority ?? 'medium'},
        ${id},
        ${data.assignee_id ?? null},
        ${data.due_date ?? null}
      )
      RETURNING *
    `
    return c.json({ task }, 201)
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// PATCH /tasks/:id
tasks.patch('/:id', async (c) => {
  const { id } = c.req.param()
  const { data, error } = await parseBody(c, updateTaskSchema)
  if (error) return c.json(error, 400)

  try {
    const [task] = await sql`SELECT id FROM tasks WHERE id = ${id}`
    if (!task) return c.json({ error: 'not found' }, 404)

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (data.title !== undefined) updates.title = data.title
    if (data.description !== undefined) updates.description = data.description
    if (data.status !== undefined) updates.status = data.status
    if (data.priority !== undefined) updates.priority = data.priority
    if (data.assignee_id !== undefined) updates.assignee_id = data.assignee_id
    if (data.due_date !== undefined) updates.due_date = data.due_date

    const [updated] = await sql`
      UPDATE tasks
      SET ${sql(updates)}
      WHERE id = ${id}
      RETURNING *
    `
    return c.json({ task: updated })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// DELETE /tasks/:id — only project owner OR task assignee
tasks.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  try {
    const [task] = await sql`
      SELECT t.id, t.assignee_id, p.owner_id
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = ${id}
    `
    if (!task) return c.json({ error: 'not found' }, 404)
    if (task.owner_id !== userId && task.assignee_id !== userId) {
      return c.json({ error: 'forbidden' }, 403)
    }

    await sql`DELETE FROM tasks WHERE id = ${id}`
    return new Response(null, { status: 204 })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

export default tasks
