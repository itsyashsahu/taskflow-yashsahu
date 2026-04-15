import type { Database } from "../lib/context.js"

export type UserRow = {
  id: string
  name: string
  email: string
  created_at: string
  theme: string
  todo_count: string
  in_progress_count: string
  done_count: string
}

export type UserTaskRow = {
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
  project_name: string
}

export const usersRepository = {
  list: async (db: Database) => {
    const rows = await db<UserRow[]>`
      SELECT
        u.id,
        u.name,
        u.email,
        u.created_at,
        COUNT(t.id) FILTER (WHERE t.status = 'todo') AS todo_count,
        COUNT(t.id) FILTER (WHERE t.status = 'in_progress') AS in_progress_count,
        COUNT(t.id) FILTER (WHERE t.status = 'done') AS done_count
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id = u.id
      GROUP BY u.id
      ORDER BY u.name ASC
    `

    return rows
  },

  getById: async (db: Database, id: string) => {
    const [user] = await db<Pick<UserRow, "id" | "name" | "email" | "created_at" | "theme">[]>`
      SELECT id, name, email, created_at, theme
      FROM users
      WHERE id = ${id}
    `

    return user ?? null
  },

  updateTheme: async (db: Database, id: string, theme: "light" | "dark" | "system") => {
    const [updated] = await db<Pick<UserRow, "id" | "name" | "email" | "theme">[]>`
      UPDATE users
      SET theme = ${theme}
      WHERE id = ${id}
      RETURNING id, name, email, theme
    `

    return updated ?? null
  },

  listAssignedTasks: async (db: Database, userId: string) => {
    const tasks = await db<UserTaskRow[]>`
      SELECT
        t.id, t.title, t.description, t.status, t.priority,
        t.project_id, t.assignee_id, t.due_date, t.created_at, t.updated_at,
        p.name AS project_name
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.assignee_id = ${userId}
      ORDER BY p.name ASC, t.created_at ASC
    `

    const projectMap = new Map<
      string,
      { project_id: string; project_name: string; tasks: UserTaskRow[] }
    >()

    for (const task of tasks) {
      if (!projectMap.has(task.project_id)) {
        projectMap.set(task.project_id, {
          project_id: task.project_id,
          project_name: task.project_name,
          tasks: [],
        })
      }

      projectMap.get(task.project_id)!.tasks.push(task)
    }

    return Array.from(projectMap.values())
  },
}