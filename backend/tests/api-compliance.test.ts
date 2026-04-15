import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { sql } from "../src/db/client.js"

const BASE_URL = process.env.BACKEND_URL || "http://localhost:3001"

type AuthResponse = {
  token: string
  user: {
    id: string
    name: string
    email: string
  }
}

function jsonHeaders(token?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function decodeJwtPayload(token: string): Record<string, any> {
  const [, payloadPart] = token.split(".")
  const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"))
}

describe("API compliance integration", () => {
  const suffix = Date.now()
  const ownerEmail = `owner-${suffix}@example.com`
  const creatorEmail = `creator-${suffix}@example.com`
  const outsiderEmail = `outsider-${suffix}@example.com`

  let ownerToken = ""
  let creatorToken = ""
  let outsiderToken = ""

  let ownerId = ""
  let creatorId = ""

  let tasksProjectId = ""
  let projectForDeleteId = ""

  let ownerTaskId = ""
  let creatorTaskId = ""

  beforeAll(async () => {
    const ownerRegister = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        name: "Owner User",
        email: ownerEmail,
        password: "password123",
      }),
    })
    expect(ownerRegister.status).toBe(201)
    const ownerBody = (await ownerRegister.json()) as AuthResponse
    ownerToken = ownerBody.token
    ownerId = ownerBody.user.id

    const creatorRegister = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        name: "Creator User",
        email: creatorEmail,
        password: "password123",
      }),
    })
    expect(creatorRegister.status).toBe(201)
    const creatorBody = (await creatorRegister.json()) as AuthResponse
    creatorToken = creatorBody.token
    creatorId = creatorBody.user.id

    const outsiderRegister = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        name: "Outsider User",
        email: outsiderEmail,
        password: "password123",
      }),
    })
    expect(outsiderRegister.status).toBe(201)
    const outsiderBody = (await outsiderRegister.json()) as AuthResponse
    outsiderToken = outsiderBody.token

    const tasksProjectRes = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: jsonHeaders(ownerToken),
      body: JSON.stringify({
        name: "Tasks Compliance Project",
        description: "Used for task endpoint tests",
      }),
    })
    expect(tasksProjectRes.status).toBe(201)
    const tasksProjectBody = (await tasksProjectRes.json()) as {
      project: { id: string }
    }
    tasksProjectId = tasksProjectBody.project.id

    const deleteProjectRes = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: jsonHeaders(ownerToken),
      body: JSON.stringify({
        name: "Delete Compliance Project",
        description: "Used for project delete auth tests",
      }),
    })
    expect(deleteProjectRes.status).toBe(201)
    const deleteProjectBody = (await deleteProjectRes.json()) as {
      project: { id: string }
    }
    projectForDeleteId = deleteProjectBody.project.id

    const ownerTaskRes = await fetch(`${BASE_URL}/projects/${tasksProjectId}/tasks`, {
      method: "POST",
      headers: jsonHeaders(ownerToken),
      body: JSON.stringify({
        title: "Owner created task",
        description: "Task made by owner",
        status: "todo",
        priority: "high",
        assignee_id: creatorId,
      }),
    })
    expect(ownerTaskRes.status).toBe(201)
    const ownerTaskBody = (await ownerTaskRes.json()) as { task: { id: string } }
    ownerTaskId = ownerTaskBody.task.id

    const creatorTaskRes = await fetch(`${BASE_URL}/projects/${tasksProjectId}/tasks`, {
      method: "POST",
      headers: jsonHeaders(creatorToken),
      body: JSON.stringify({
        title: "Creator created task",
        description: "Task made by creator",
        status: "in_progress",
        priority: "medium",
      }),
    })
    expect(creatorTaskRes.status).toBe(201)
    const creatorTaskBody = (await creatorTaskRes.json()) as { task: { id: string } }
    creatorTaskId = creatorTaskBody.task.id
  })

  afterAll(async () => {
    await sql`DELETE FROM users WHERE email IN (${ownerEmail}, ${creatorEmail}, ${outsiderEmail})`
  })

  describe("Authentication endpoints", () => {
    it("POST /auth/register returns jwt with required claims and correct expiry window", async () => {
      const now = Math.floor(Date.now() / 1000)
      const payload = decodeJwtPayload(ownerToken)

      expect(payload.user_id).toBe(ownerId)
      expect(payload.email).toBe(ownerEmail)
      expect(payload.exp).toBeGreaterThanOrEqual(now + 23 * 60 * 60)
      expect(payload.exp).toBeLessThanOrEqual(now + 25 * 60 * 60)
    })

    it("POST /auth/register stores hashed password with bcrypt cost >= 12", async () => {
      const [row] = await sql<{ password: string }[]>`
        SELECT password
        FROM users
        WHERE email = ${ownerEmail}
      `

      expect(row.password).not.toBe("password123")
      expect(row.password.startsWith("$2")).toBe(true)

      const rounds = Number(row.password.split("$")[2])
      expect(rounds).toBeGreaterThanOrEqual(12)
    })

    it("POST /auth/register returns structured validation errors", async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          name: "",
        }),
      })

      expect(res.status).toBe(400)
      expect(res.headers.get("content-type") || "").toContain("application/json")

      const body = (await res.json()) as {
        error: string
        fields: Record<string, string>
      }
      expect(body.error).toBe("validation failed")
      expect(body.fields).toBeDefined()
      expect(Object.keys(body.fields).length).toBeGreaterThan(0)
    })

    it("POST /auth/login succeeds with valid credentials", async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          email: ownerEmail,
          password: "password123",
        }),
      })

      expect(res.status).toBe(200)
      expect(res.headers.get("content-type") || "").toContain("application/json")

      const body = (await res.json()) as AuthResponse
      expect(body.token).toBeDefined()
      expect(body.user.email).toBe(ownerEmail)
    })
  })

  describe("Project endpoints", () => {
    it("GET /projects returns 401 without bearer token", async () => {
      const res = await fetch(`${BASE_URL}/projects`)
      expect(res.status).toBe(401)
      expect(res.headers.get("content-type") || "").toContain("application/json")
    })

    it("GET /projects returns owner or assigned projects", async () => {
      const ownerRes = await fetch(`${BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
      expect(ownerRes.status).toBe(200)
      const ownerBody = (await ownerRes.json()) as {
        projects: Array<{ id: string }>
      }
      expect(ownerBody.projects.some((p) => p.id === tasksProjectId)).toBe(true)

      const creatorRes = await fetch(`${BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${creatorToken}` },
      })
      expect(creatorRes.status).toBe(200)
      const creatorBody = (await creatorRes.json()) as {
        projects: Array<{ id: string }>
      }
      expect(creatorBody.projects.some((p) => p.id === tasksProjectId)).toBe(true)
    })

    it("GET /projects/:id returns project details with tasks", async () => {
      const res = await fetch(`${BASE_URL}/projects/${tasksProjectId}`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
      expect(res.status).toBe(200)
      const body = (await res.json()) as {
        project: { id: string; tasks: unknown[] }
      }
      expect(body.project.id).toBe(tasksProjectId)
      expect(Array.isArray(body.project.tasks)).toBe(true)
    })

    it("GET /projects/:id returns 404 for unknown id", async () => {
      const res = await fetch(`${BASE_URL}/projects/00000000-0000-0000-0000-000000000999`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
      expect(res.status).toBe(404)
      const body = (await res.json()) as { error: string }
      expect(body.error).toBe("not found")
    })

    it("PATCH /projects/:id allows owner and blocks non-owner with 403", async () => {
      const ownerPatch = await fetch(`${BASE_URL}/projects/${projectForDeleteId}`, {
        method: "PATCH",
        headers: jsonHeaders(ownerToken),
        body: JSON.stringify({ name: "Updated by owner" }),
      })
      expect(ownerPatch.status).toBe(200)

      const outsiderPatch = await fetch(`${BASE_URL}/projects/${projectForDeleteId}`, {
        method: "PATCH",
        headers: jsonHeaders(outsiderToken),
        body: JSON.stringify({ name: "Should fail" }),
      })
      expect(outsiderPatch.status).toBe(403)
      const body = (await outsiderPatch.json()) as { error: string }
      expect(body.error).toBe("forbidden")
    })

    it("DELETE /projects/:id allows owner and blocks non-owner with 403", async () => {
      const outsiderDelete = await fetch(`${BASE_URL}/projects/${projectForDeleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${outsiderToken}` },
      })
      expect(outsiderDelete.status).toBe(403)

      const ownerDelete = await fetch(`${BASE_URL}/projects/${projectForDeleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
      expect(ownerDelete.status).toBe(204)

      const afterDelete = await fetch(`${BASE_URL}/projects/${projectForDeleteId}`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
      expect(afterDelete.status).toBe(404)
    })
  })

  describe("Task endpoints", () => {
    it("GET /projects/:id/tasks supports status and assignee filters", async () => {
      const byStatus = await fetch(
        `${BASE_URL}/projects/${tasksProjectId}/tasks?status=todo`,
        { headers: { Authorization: `Bearer ${ownerToken}` } }
      )
      expect(byStatus.status).toBe(200)
      const statusBody = (await byStatus.json()) as {
        tasks: Array<{ status: string }>
      }
      expect(statusBody.tasks.every((t) => t.status === "todo")).toBe(true)

      const byAssignee = await fetch(
        `${BASE_URL}/projects/${tasksProjectId}/tasks?assignee=${creatorId}`,
        { headers: { Authorization: `Bearer ${ownerToken}` } }
      )
      expect(byAssignee.status).toBe(200)
      const assigneeBody = (await byAssignee.json()) as {
        tasks: Array<{ assignee_id: string | null }>
      }
      expect(assigneeBody.tasks.length).toBeGreaterThan(0)
      expect(assigneeBody.tasks.every((t) => t.assignee_id === creatorId)).toBe(true)
    })

    it("GET /projects/:id/tasks returns 401 without auth", async () => {
      const res = await fetch(`${BASE_URL}/projects/${tasksProjectId}/tasks`)
      expect(res.status).toBe(401)
    })

    it("POST /projects/:id/tasks creates tasks and returns 400 for invalid payload", async () => {
      const createRes = await fetch(`${BASE_URL}/projects/${tasksProjectId}/tasks`, {
        method: "POST",
        headers: jsonHeaders(ownerToken),
        body: JSON.stringify({
          title: "New task from API test",
          priority: "low",
          status: "todo",
        }),
      })
      expect(createRes.status).toBe(201)
      const createBody = (await createRes.json()) as { task: { id: string } }
      expect(createBody.task.id).toBeDefined()

      const invalidRes = await fetch(`${BASE_URL}/projects/${tasksProjectId}/tasks`, {
        method: "POST",
        headers: jsonHeaders(ownerToken),
        body: JSON.stringify({
          title: "",
        }),
      })
      expect(invalidRes.status).toBe(400)
      const invalidBody = (await invalidRes.json()) as {
        error: string
        fields: Record<string, string>
      }
      expect(invalidBody.error).toBe("validation failed")
      expect(invalidBody.fields.title).toBeDefined()
    })

    it("PATCH /tasks/:id updates task fields", async () => {
      const res = await fetch(`${BASE_URL}/tasks/${ownerTaskId}`, {
        method: "PATCH",
        headers: jsonHeaders(ownerToken),
        body: JSON.stringify({
          status: "done",
          priority: "medium",
          due_date: "2026-12-31",
        }),
      })

      expect(res.status).toBe(200)
      const body = (await res.json()) as {
        task: { id: string; status: string; priority: string; due_date: string | null }
      }
      expect(body.task.id).toBe(ownerTaskId)
      expect(body.task.status).toBe("done")
      expect(body.task.priority).toBe("medium")
      expect(body.task.due_date?.startsWith("2026-12-31")).toBe(true)
    })

    it("DELETE /tasks/:id enforces owner-or-creator authorization", async () => {
      const outsiderDelete = await fetch(`${BASE_URL}/tasks/${creatorTaskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${outsiderToken}` },
      })
      expect(outsiderDelete.status).toBe(403)

      const creatorDelete = await fetch(`${BASE_URL}/tasks/${creatorTaskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${creatorToken}` },
      })
      expect(creatorDelete.status).toBe(204)

      const deletedFetch = await fetch(`${BASE_URL}/tasks/${creatorTaskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${creatorToken}` },
      })
      expect(deletedFetch.status).toBe(404)
    })

    it("DELETE /tasks/:id also allows project owner", async () => {
      const creatorMadeTask = await fetch(`${BASE_URL}/projects/${tasksProjectId}/tasks`, {
        method: "POST",
        headers: jsonHeaders(creatorToken),
        body: JSON.stringify({
          title: "Task to be deleted by project owner",
          status: "todo",
          priority: "low",
        }),
      })
      expect(creatorMadeTask.status).toBe(201)
      const body = (await creatorMadeTask.json()) as { task: { id: string } }

      const ownerDelete = await fetch(`${BASE_URL}/tasks/${body.task.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
      expect(ownerDelete.status).toBe(204)
    })
  })
})
