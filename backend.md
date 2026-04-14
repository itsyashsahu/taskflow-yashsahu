# TaskFlow — Backend Build Outline

## Stack
- **Runtime:** Node.js 20
- **Framework:** Hono + @hono/node-server
- **Language:** TypeScript
- **Database:** PostgreSQL 16
- **DB driver:** postgres (npm) — raw SQL, no ORM
- **Migrations:** dbmate
- **Validation:** Zod
- **Auth:** hono/jwt + bcryptjs
- **Logging:** pino
- **Graceful shutdown:** built into Node.js SIGTERM handler

---

## Project Structure

```
backend/
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env.example
├── db/
│   ├── migrations/
│   │   ├── 20240101000001_create_users.sql
│   │   ├── 20240101000002_create_projects.sql
│   │   └── 20240101000003_create_tasks.sql
│   └── seed.sql
└── src/
    ├── index.ts                  ← server entry, graceful shutdown
    ├── db/
    │   └── client.ts             ← postgres connection pool
    ├── middleware/
    │   └── auth.ts               ← JWT verification middleware
    ├── lib/
    │   ├── validate.ts           ← Zod → structured error shape helper
    │   └── hash.ts               ← bcrypt helpers (hash + compare)
    └── routes/
        ├── auth.ts               ← POST /auth/register, POST /auth/login
        ├── projects.ts           ← /projects + /projects/:id
        ├── tasks.ts              ← /projects/:id/tasks + /tasks/:id
        └── users.ts              ← GET /users (team page)
```

---

## Database Schema

### Migration 1 — users
```sql
-- migrate:up
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- migrate:down
DROP TABLE users;
```

### Migration 2 — projects
```sql
-- migrate:up
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);

-- migrate:down
DROP TABLE projects;
```

### Migration 3 — tasks
```sql
-- migrate:up
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  status      task_status NOT NULL DEFAULT 'todo',
  priority    task_priority NOT NULL DEFAULT 'medium',
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);

-- migrate:down
DROP TABLE tasks;
DROP TYPE task_status;
DROP TYPE task_priority;
```

---

## Seed Data (`db/seed.sql`)
```sql
-- Password is 'password123' (bcrypt cost 12)
INSERT INTO users (id, name, email, password) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test User', 'test@example.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oZ7wGaUSe'),
  ('00000000-0000-0000-0000-000000000002', 'Jane Doe', 'jane@example.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oZ7wGaUSe');

INSERT INTO projects (id, name, description, owner_id) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Website Redesign',
   'Internal engineering portal featuring new documentation structures.',
   '00000000-0000-0000-0000-000000000001');

INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, due_date) VALUES
  ('Design homepage', 'Create wireframes for the new homepage layout',
   'todo', 'high',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000001',
   CURRENT_DATE + INTERVAL '7 days'),

  ('Set up CI/CD pipeline', 'Configure GitHub Actions for automated deployments',
   'in_progress', 'medium',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000002',
   CURRENT_DATE + INTERVAL '3 days'),

  ('Write API documentation', 'Document all REST endpoints with request/response examples',
   'done', 'low',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000001',
   CURRENT_DATE - INTERVAL '2 days');
```

---

## API Endpoints

### Auth — no JWT required

**POST `/auth/register`**
- Body: `{ name, email, password }`
- Validate: all required, email format, password min 8 chars
- Hash password: bcrypt cost 12
- Insert user, return JWT + user object
- Error if email already exists → 400 `{ error: "email already in use" }`

**POST `/auth/login`**
- Body: `{ email, password }`
- Find user by email → 401 if not found
- Compare bcrypt hash → 401 if mismatch
- Return JWT (24hr expiry, claims: `user_id`, `email`) + user object

---

### Projects — JWT required

**GET `/projects`**
- Returns projects where `owner_id = current_user` OR project has at least one task assigned to current user
- SQL: LEFT JOIN tasks on project, WHERE owner_id = $1 OR assignee_id = $1
- Include task counts per status in response (avoids extra roundtrip from frontend)

**POST `/projects`**
- Body: `{ name, description? }`
- Validate: name required
- Insert with `owner_id = current_user`
- Return created project

**GET `/projects/:id`**
- Fetch project + all its tasks in one query (JOIN)
- 404 if project not found
- Return project object with nested `tasks` array

**PATCH `/projects/:id`**
- Body: `{ name?, description? }`
- 403 if current user is not owner
- Update only provided fields (partial update)
- Return updated project

**DELETE `/projects/:id`**
- 403 if current user is not owner
- CASCADE deletes all tasks (handled by FK constraint)
- Return 204

---

### Tasks — JWT required

**GET `/projects/:id/tasks`**
- Query params: `?status=todo|in_progress|done` and `?assignee=uuid`
- Both filters optional, AND logic when both provided
- 404 if project not found
- Return `{ tasks: [...] }`

**POST `/projects/:id/tasks`**
- Body: `{ title, description?, status?, priority?, assignee_id?, due_date? }`
- Validate: title required, status/priority must be valid enum values if provided
- 404 if project not found
- Return created task

**PATCH `/tasks/:id`**
- Body: `{ title?, description?, status?, priority?, assignee_id?, due_date? }`
- All fields optional — only update what's provided
- Set `updated_at = NOW()` on every update
- 404 if task not found
- Return updated task

**DELETE `/tasks/:id`**
- Only project owner OR task assignee can delete
- 403 otherwise
- Return 204

---

### Users — JWT required (extra endpoint for team page)

**GET `/users`**
- Returns all users with aggregated task counts
- SQL:
```sql
SELECT
  u.id, u.name, u.email, u.created_at,
  COUNT(t.id) FILTER (WHERE t.status = 'todo') as todo_count,
  COUNT(t.id) FILTER (WHERE t.status = 'in_progress') as in_progress_count,
  COUNT(t.id) FILTER (WHERE t.status = 'done') as done_count
FROM users u
LEFT JOIN tasks t ON t.assignee_id = u.id
GROUP BY u.id
```
- Never return `password` field

**GET `/users/:id/tasks`**
- Returns all tasks assigned to a specific user, grouped by project
- Used by the Member Tasks page (`/team/:userId`)

---

### Bonus Endpoint

**GET `/projects/:id/stats`**
```json
{
  "total": 10,
  "by_status": {
    "todo": 3,
    "in_progress": 2,
    "done": 5
  },
  "by_assignee": [
    { "user_id": "uuid", "name": "Alex Chen", "count": 4 }
  ]
}
```

---

## Error Response Shape

All error responses follow this structure consistently:

```ts
// 400 Validation error
{ "error": "validation failed", "fields": { "email": "is required" } }

// 401 Unauthenticated (no token or invalid token)
{ "error": "unauthorized" }

// 403 Forbidden (valid token, wrong permissions)
{ "error": "forbidden" }

// 404 Not found
{ "error": "not found" }

// 500 Internal
{ "error": "internal server error" }
```

**Never conflate 401 and 403.** Missing/invalid JWT = 401. Valid JWT but wrong owner = 403.

---

## Auth Middleware (`src/middleware/auth.ts`)

```ts
export const requireAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  const token = authHeader.slice(7)
  try {
    const payload = await verify(token, Bun.env.JWT_SECRET!)
    c.set('userId', payload.user_id)
    c.set('userEmail', payload.email)
    await next()
  } catch {
    return c.json({ error: 'unauthorized' }, 401)
  }
})
```

---

## Validation Helper (`src/lib/validate.ts`)

```ts
// Converts Zod errors to the spec's field error shape
export const parseBody = async <T>(c: Context, schema: ZodSchema<T>) => {
  const body = await c.req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    const fields: Record<string, string> = {}
    result.error.errors.forEach(e => {
      fields[e.path.join('.')] = e.message
    })
    return { data: null, error: { error: 'validation failed', fields } }
  }
  return { data: result.data, error: null }
}
```

---

## JWT Claims

```ts
// Signing (on login/register)
const token = await sign(
  { user_id: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 86400 },
  process.env.JWT_SECRET!
)
```

- Expiry: 24 hours (86400 seconds)
- Claims: `user_id`, `email`
- Secret: from `JWT_SECRET` env var — never hardcoded

---

## Server Entry (`src/index.ts`)

```ts
const app = new Hono()

// Global middleware
app.use('*', logger())    // pino structured logging
app.use('*', cors())

// Routes
app.route('/auth', authRoutes)
app.route('/projects', requireAuth, projectRoutes)
app.route('/tasks', requireAuth, taskRoutes)
app.route('/users', requireAuth, userRoutes)

// Graceful shutdown
const server = serve({ fetch: app.fetch, port: 3001 })

process.on('SIGTERM', () => {
  server.close(() => {
    sql.end()           // close postgres pool
    process.exit(0)
  })
})
```

---

## Environment Variables (`.env.example`)

```bash
# Database
DATABASE_URL=postgres://postgres:postgres@db:5432/taskflow

# Auth
JWT_SECRET=change_this_to_a_random_secret_in_production

# Server
PORT=3001
NODE_ENV=development
```

---

## Docker

```dockerfile
# Stage 1 — build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build       # tsc → dist/

# Stage 2 — runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/db ./db
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

---

## Docker Compose (`docker-compose.yml`)

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: taskflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  migrate:
    image: ghcr.io/amacneil/dbmate:latest
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/taskflow?sslmode=disable
    volumes:
      - ./backend/db:/db
    command: ["up"]
    depends_on:
      db:
        condition: service_healthy

  seed:
    image: postgres:16-alpine
    environment:
      PGPASSWORD: postgres
    volumes:
      - ./backend/db/seed.sql:/seed.sql
    command: >
      psql -h db -U postgres -d taskflow -f /seed.sql
    depends_on:
      - migrate

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    env_file: .env
    depends_on:
      - seed

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Implementation Order

1. DB client + migrations (all 3 tables)
2. Seed data
3. Auth routes (register + login) — test with curl first
4. JWT middleware
5. Projects routes (CRUD)
6. Tasks routes (CRUD + filters)
7. Users route (GET /users with counts)
8. Users route (GET /users/:id/tasks)
9. Bonus: GET /projects/:id/stats
10. Structured logging (pino)
11. Graceful shutdown
12. Docker + docker-compose wiring
13. Verify `docker compose up` works cold with zero manual steps

---

## Testing Credentials (after seed)

```
Email:    test@example.com
Password: password123
```