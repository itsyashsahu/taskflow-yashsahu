import type { Database } from "../lib/context.js"
import type { TaskRow } from "./projects.repository.js"
import { emitDataUpdate } from "../lib/events.js"

export const tasksRepository = {
  listForProject: async (
    db: Database,
    projectId: string,
    filters?: { status?: string; assignee?: string }
  ) => {
    const rows = await db<TaskRow[]>`
      SELECT
        t.id, t.title, t.description, t.status, t.priority,
        t.project_id, t.creator_id, t.assignee_id, t.due_date, t.created_at, t.updated_at,
        u.name AS assignee_name, u.email AS assignee_email
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      WHERE t.project_id = ${projectId}
        ${filters?.status ? db`AND t.status = ${filters.status}::task_status` : db``}
        ${filters?.assignee ? db`AND t.assignee_id = ${filters.assignee}` : db``}
      ORDER BY t.created_at ASC
    `

    return rows
  },

  create: async (
    db: Database,
    projectId: string,
    input: {
      title: string
      description?: string | null
      status?: "todo" | "in_progress" | "done"
      priority?: "low" | "medium" | "high"
      assignee_id?: string | null
      due_date?: string | null
      creator_id: string
    }
  ) => {
    const [task] = await db<TaskRow[]>`
      INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, due_date, creator_id)
      VALUES (
        ${input.title},
        ${input.description ?? null},
        ${input.status ?? "todo"},
        ${input.priority ?? "medium"},
        ${projectId},
        ${input.assignee_id ?? null},
        ${input.due_date ?? null},
        ${input.creator_id}
      )
      RETURNING
        id, title, description, status, priority,
        project_id, creator_id, assignee_id, due_date, created_at, updated_at,
        NULL::text AS assignee_name,
        NULL::text AS assignee_email
    `

    if (task) {
      emitDataUpdate("create", "task", task.id, { projectId })
    }

    return task
  },

  getById: async (db: Database, id: string) => {
    const [task] = await db<{ id: string }[]>`
      SELECT id
      FROM tasks
      WHERE id = ${id}
    `

    return task ?? null
  },

  getForDeletion: async (db: Database, id: string) => {
    const [task] = await db<{ id: string; creator_id: string; owner_id: string }[]>`
      SELECT t.id, t.creator_id, p.owner_id
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = ${id}
    `

    return task ?? null
  },

  update: async (
    db: Database,
    id: string,
    updates: {
      title?: string
      description?: string | null
      status?: "todo" | "in_progress" | "done"
      priority?: "low" | "medium" | "high"
      assignee_id?: string | null
      due_date?: string | null
      updated_at?: Date
    }
  ) => {
    const [task] = await db<TaskRow[]>`
      UPDATE tasks
      SET ${db(updates)}
      WHERE id = ${id}
      RETURNING
        id, title, description, status, priority,
        project_id, creator_id, assignee_id, due_date, created_at, updated_at,
        NULL::text AS assignee_name,
        NULL::text AS assignee_email
    `

    if (task) {
      emitDataUpdate("update", "task", task.id, { projectId: task.project_id })
    }

    return task ?? null
  },

  delete: async (db: Database, id: string) => {
    await db`
      DELETE FROM tasks
      WHERE id = ${id}
    `
    emitDataUpdate("delete", "task", id)
  },
}