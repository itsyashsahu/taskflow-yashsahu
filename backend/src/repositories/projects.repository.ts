import type { Database } from "../lib/context.js"

export type ProjectRow = {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
}

export type ProjectWithTaskCountsRow = ProjectRow & {
  todo_count: string
  in_progress_count: string
  done_count: string
}

export type TaskRow = {
  id: string
  title: string
  description: string | null
  status: "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high"
  project_id: string
  assignee_id: string | null
  due_date: string | null
  created_at: string
  updated_at: string
  assignee_name: string | null
  assignee_email: string | null
}

export type ProjectStatsAssigneeRow = {
  user_id: string
  name: string
  count: string
}

export const projectsRepository = {
  listForUser: async (db: Database, userId: string) => {
    const rows = await db<ProjectWithTaskCountsRow[]>`
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

    return rows
  },

  create: async (
    db: Database,
    input: { name: string; description?: string | null },
    ownerId: string
  ) => {
    const [project] = await db<ProjectRow[]>`
      INSERT INTO projects (name, description, owner_id)
      VALUES (${input.name}, ${input.description ?? null}, ${ownerId})
      RETURNING id, name, description, owner_id, created_at
    `

    return project
  },

  getById: async (db: Database, id: string) => {
    const [project] = await db<ProjectRow[]>`
      SELECT id, name, description, owner_id, created_at
      FROM projects
      WHERE id = ${id}
    `

    return project ?? null
  },

  getOwner: async (db: Database, id: string) => {
    const [project] = await db<{ id: string; owner_id: string }[]>`
      SELECT id, owner_id
      FROM projects
      WHERE id = ${id}
    `

    return project ?? null
  },

  getWithTasks: async (db: Database, id: string) => {
    const project = await projectsRepository.getById(db, id)
    if (!project) {
      return null
    }

    const tasks = await db<TaskRow[]>`
      SELECT
        t.id, t.title, t.description, t.status, t.priority,
        t.project_id, t.assignee_id, t.due_date, t.created_at, t.updated_at,
        u.name AS assignee_name, u.email AS assignee_email
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      WHERE t.project_id = ${id}
      ORDER BY t.created_at ASC
    `

    return { ...project, tasks }
  },

  update: async (
    db: Database,
    id: string,
    updates: { name?: string; description?: string | null }
  ) => {
    const [project] = await db<ProjectRow[]>`
      UPDATE projects
      SET ${db(updates)}
      WHERE id = ${id}
      RETURNING id, name, description, owner_id, created_at
    `

    return project ?? null
  },

  delete: async (db: Database, id: string) => {
    await db`
      DELETE FROM projects
      WHERE id = ${id}
    `
  },

  getStats: async (db: Database, id: string) => {
    const [counts] = await db<
      {
        total: string
        todo: string
        in_progress: string
        done: string
      }[]
    >`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'todo') AS todo,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'done') AS done
      FROM tasks
      WHERE project_id = ${id}
    `

    const byAssignee = await db<ProjectStatsAssigneeRow[]>`
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

    return { counts, byAssignee }
  },
}