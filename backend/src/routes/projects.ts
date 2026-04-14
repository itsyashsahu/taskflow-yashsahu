import { Hono } from 'hono'
import { z } from 'zod'
import { sql } from '../db/client.js'
import type { AuthVariables } from '../middleware/auth.js'
import { parseBody } from '../lib/validate.js'

const projects = new Hono<{ Variables: AuthVariables }>()

const createProjectSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
})

// GET /projects — projects owned by or assigned to current user, with task counts
projects.get('/', async (c) => {
  const userId = c.get('userId')
  try {
    const rows = await sql`
      SELECT
        p.id,
        p.name,
        p.description,
        p.owner_id,
        p.created_at,
        COUNT(t.id) FILTER (WHERE t.status = 'todo') AS todo_count,
        COUNT(t.id) FILTER (WHERE t.status = 'in_progress') AS in_progress_count,
        COUNT(t.id) FILTER (WHERE t.status = 'done') AS done_count
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.owner_id = ${userId}
         OR EXISTS (
           SELECT 1 FROM tasks t2
           WHERE t2.project_id = p.id AND t2.assignee_id = ${userId}
         )
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `
    return c.json({ projects: rows })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// POST /projects
projects.post('/', async (c) => {
  const userId = c.get('userId')
  const { data, error } = await parseBody(c, createProjectSchema)
  if (error) return c.json(error, 400)

  try {
    const [project] = await sql`
      INSERT INTO projects (name, description, owner_id)
      VALUES (${data.name}, ${data.description ?? null}, ${userId})
      RETURNING *
    `
    return c.json({ project }, 201)
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// GET /projects/:id — project with all its tasks
projects.get('/:id', async (c) => {
  const { id } = c.req.param()
  try {
    const [project] = await sql`
      SELECT id, name, description, owner_id, created_at
      FROM projects
      WHERE id = ${id}
    `
    if (!project) return c.json({ error: 'not found' }, 404)

    const tasks = await sql`
      SELECT
        t.id, t.title, t.description, t.status, t.priority,
        t.project_id, t.assignee_id, t.due_date, t.created_at, t.updated_at,
        u.name AS assignee_name, u.email AS assignee_email
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      WHERE t.project_id = ${id}
      ORDER BY t.created_at ASC
    `

    return c.json({ project: { ...project, tasks } })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// PATCH /projects/:id
projects.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()
  const { data, error } = await parseBody(c, updateProjectSchema)
  if (error) return c.json(error, 400)

  try {
    const [project] = await sql`SELECT id, owner_id FROM projects WHERE id = ${id}`
    if (!project) return c.json({ error: 'not found' }, 404)
    if (project.owner_id !== userId) return c.json({ error: 'forbidden' }, 403)

    const updates: Record<string, unknown> = {}
    if (data.name !== undefined) updates.name = data.name
    if (data.description !== undefined) updates.description = data.description

    if (Object.keys(updates).length === 0) {
      const [current] = await sql`SELECT * FROM projects WHERE id = ${id}`
      return c.json({ project: current })
    }

    const [updated] = await sql`
      UPDATE projects
      SET ${sql(updates)}
      WHERE id = ${id}
      RETURNING *
    `
    return c.json({ project: updated })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// DELETE /projects/:id
projects.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  try {
    const [project] = await sql`SELECT id, owner_id FROM projects WHERE id = ${id}`
    if (!project) return c.json({ error: 'not found' }, 404)
    if (project.owner_id !== userId) return c.json({ error: 'forbidden' }, 403)

    await sql`DELETE FROM projects WHERE id = ${id}`
    return new Response(null, { status: 204 })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'internal server error' }, 500)
  }
})

// GET /projects/:id/stats
projects.get('/:id/stats', async (c) => {
  const { id } = c.req.param()

  try {
    const [project] = await sql`SELECT id FROM projects WHERE id = ${id}`
    if (!project) return c.json({ error: 'not found' }, 404)

    const [counts] = await sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'todo') AS todo,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'done') AS done
      FROM tasks
      WHERE project_id = ${id}
    `

    const byAssignee = await sql`
      SELECT
        u.id AS user_id,
        u.name,
        COUNT(t.id) AS count
      FROM tasks t
      JOIN users u ON u.id = t.assignee_id
      WHERE t.project_id = ${id} AND t.assignee_id IS NOT NULL
      GROUP BY u.id, u.name
      ORDER BY count DESC
    `

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
