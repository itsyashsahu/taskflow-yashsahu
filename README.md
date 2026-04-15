# TaskFlow

A full-stack task management application with JWT authentication, project/task workflows, role-based authorization, real-time updates via SSE, and a responsive React UI.

## 1. Overview

TaskFlow allows users to:
- Register and log in.
- Create projects.
- Create, update, assign, and delete tasks.
- Filter tasks by status and assignee.
- View team member task distribution.
- Use persisted theme preferences and real-time task/project updates.

Tech stack:
- Backend: Node.js + TypeScript + Hono + PostgreSQL + dbmate migrations.
- Frontend: React + TypeScript + React Router + TanStack Query + shadcn/ui.
- Infra: Docker + Docker Compose.

## 2. Architecture Decisions

- API-first separation: frontend and backend are separate deployable units under a monorepo layout.
- Repository pattern in backend: route handlers delegate DB access to repository modules for easier testability and cleaner route logic.
- JWT Bearer auth middleware: centralized auth guard for protected routes.
- Explicit SQL migrations: db schema changes are managed with up/down migration files via dbmate.
- Query-based state management: TanStack Query handles server state caching, invalidation, and request lifecycle.
- SSE for realtime updates: backend publishes events and frontend invalidates query keys when updates arrive.

Tradeoffs:
- Chose direct SQL over ORM for explicitness and control.
- Used UUID primary keys for distributed-safe IDs and to avoid predictable incremental identifiers.
- Frontend includes route-level guards and optimistic interactions where it improves UX.

Intentional scope limits:
- No advanced RBAC beyond owner/authorized-user checks.
- No background job system.
- No file attachments/comments system.

## 3. Running Locally

Prerequisites:
- Docker + Docker Compose

Commands:

```bash
git clone <your-repo-url>
cd taskflow
cp .env.example .env
docker compose up
```

Services:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Postgres: internal docker network (`postgres:5432`)

## 4. Running Migrations

Migrations run automatically on backend container startup using dbmate.

If you want to run manually from backend container context:

```bash
docker compose exec backend dbmate --url "$DATABASE_URL" up
docker compose exec backend dbmate --url "$DATABASE_URL" down
```

## 5. Test Credentials

Seed user credentials:

- Email: test@example.com
- Password: password123

Additional seeded users (same password):
- jane@example.com
- john@example.com
- priya@example.com

## 6. API Reference

Authentication:
- POST /auth/register
- POST /auth/login

Projects:
- GET /projects
- POST /projects
- GET /projects/:id
- PATCH /projects/:id
- DELETE /projects/:id
- GET /projects/:id/stats

Tasks:
- GET /projects/:id/tasks?status=&assignee=
- POST /projects/:id/tasks
- PATCH /tasks/:id
- DELETE /tasks/:id

Users:
- GET /users
- GET /users/me
- PATCH /users/theme
- GET /users/:id/tasks

Error shape examples:

```json
{ "error": "validation failed", "fields": { "email": "is required" } }
```

```json
{ "error": "unauthorized" }
```

```json
{ "error": "forbidden" }
```

```json
{ "error": "not found" }
```

Bruno collection is available under backend/bruno.

## 7. What I'd Do With More Time

- Add end-to-end integration tests for critical auth/task flows and authorization boundaries.
- Add pagination and cursor-based list APIs for large datasets.
- Add stricter input validation and request/response schema docs (OpenAPI generation).
- Improve observability with structured request tracing + metrics dashboards.
- Add background notifications and websocket presence for richer collaboration.
- Harden security with refresh-token rotation and token revocation strategy.
