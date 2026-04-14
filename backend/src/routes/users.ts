import { Hono } from "hono";
import { sql } from "../db/client.js";
import type { AuthVariables } from "../middleware/auth.js";

const users = new Hono<{ Variables: AuthVariables }>();

// GET /users — all users with aggregated task counts (never returns password)
users.get("/", async (c) => {
  try {
    const rows = await sql`
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
    `;
    return c.json({ users: rows });
  } catch (err) {
    console.error(err);
    return c.json({ error: "internal server error" }, 500);
  }
});

// GET /users/:id/tasks — tasks assigned to a specific user, grouped by project
users.get("/:id/tasks", async (c) => {
  const { id } = c.req.param();

  try {
    const [user] = await sql`
      SELECT id, name, email, created_at FROM users WHERE id = ${id}
    `;
    if (!user) return c.json({ error: "not found" }, 404);

    const tasks = await sql`
      SELECT
        t.id, t.title, t.description, t.status, t.priority,
        t.project_id, t.assignee_id, t.due_date, t.created_at, t.updated_at,
        p.name AS project_name
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.assignee_id = ${id}
      ORDER BY p.name ASC, t.created_at ASC
    `;

    // Group tasks by project
    type TaskRow = (typeof tasks)[number];
    const projectMap = new Map<
      string,
      { project_id: string; project_name: string; tasks: TaskRow[] }
    >();
    for (const task of tasks) {
      if (!projectMap.has(task.project_id)) {
        projectMap.set(task.project_id, {
          project_id: task.project_id,
          project_name: task.project_name,
          tasks: [] as TaskRow[],
        });
      }
      projectMap.get(task.project_id)!.tasks.push(task);
    }

    return c.json({
      user,
      projects: Array.from(projectMap.values()),
    });
  } catch (err) {
    console.error(err);
    return c.json({ error: "internal server error" }, 500);
  }
});

export default users;
