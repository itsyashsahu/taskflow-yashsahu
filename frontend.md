# TaskFlow — Frontend Build Outline

## Stack
- **Framework:** React 18 + TypeScript + Vite
- **Routing:** React Router v6
- **Server state:** TanStack Query v5
- **Client state:** Zustand (auth store only)
- **UI components:** shadcn/ui + Tailwind CSS
- **Drag and drop:** @dnd-kit/core (board view only)
- **Notifications:** shadcn Sonner (toast)
- **Icons:** Lucide React

---

## Project Structure

```
frontend/
├── Dockerfile
├── nginx.conf
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── router.tsx
    ├── store/
    │   └── auth.ts                  ← Zustand auth store (persists to localStorage)
    ├── api/
    │   ├── client.ts                ← base fetch wrapper (attaches JWT header)
    │   ├── auth.ts                  ← login / register mutations
    │   ├── projects.ts              ← TanStack Query hooks for projects
    │   ├── tasks.ts                 ← TanStack Query hooks for tasks
    │   └── users.ts                 ← TanStack Query hooks for users/team
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.tsx          ← fixed sidebar, shared across all pages
    │   │   └── ProtectedRoute.tsx   ← redirects to /login if unauthenticated
    │   ├── projects/
    │   │   ├── ProjectCard.tsx
    │   │   ├── CreateProjectModal.tsx
    │   │   └── EditProjectModal.tsx
    │   ├── tasks/
    │   │   ├── TaskRow.tsx          ← list view row with circle status icon
    │   │   ├── TaskCard.tsx         ← board view card
    │   │   ├── TaskDrawer.tsx       ← create/edit drawer (shared, pre-fill for edit)
    │   │   ├── StatusIcon.tsx       ← hollow / half-filled / checkmark SVG
    │   │   └── PriorityBadge.tsx    ← colored dot + label
    │   └── ui/                      ← shadcn/ui generated components live here
    └── pages/
        ├── Login.tsx
        ├── Register.tsx
        ├── Projects.tsx             ← /projects
        ├── ProjectDetail.tsx        ← /projects/:id (list + board view toggle)
        ├── MyTasks.tsx              ← /my-tasks
        ├── Team.tsx                 ← /team
        ├── MemberTasks.tsx          ← /team/:userId
        └── Settings.tsx             ← /settings
```

---

## Routes

| Path | Component | Protected |
|---|---|---|
| `/login` | Login.tsx | No |
| `/register` | Register.tsx | No |
| `/projects` | Projects.tsx | Yes |
| `/projects/:id` | ProjectDetail.tsx | Yes |
| `/my-tasks` | MyTasks.tsx | Yes |
| `/team` | Team.tsx | Yes |
| `/team/:userId` | MemberTasks.tsx | Yes |
| `/settings` | Settings.tsx | Yes |

Unauthenticated access to any protected route → redirect to `/login`.
After login → redirect to `/projects`.

---

## Pages

### 1. Login / Register
- Client-side validation with inline field errors
- On success: store JWT + user in Zustand → localStorage
- On error: show API error message below the form
- Switch between login and register via a text link (no separate page needed for register — same layout)

### 2. Projects (`/projects`)
- 3-column responsive card grid
- Each card: project name, description, colored status badge, progress bar (X/Y tasks), avatar stack, created date
- `+ Create Project` button top right → opens CreateProjectModal
- `...` on card hover → Edit / Delete (owner only)
- Empty state: centered illustration + "Start a Project" dashed card
- `+ New Project` button pinned to sidebar bottom

### 3. Project Detail (`/projects/:id`)

**Header (two rows):**
- Row 1: Project name H1, status badge, pencil icon (→ EditProjectModal), List/Board toggle (☰ / ⊞), `+ Add Task` button
- Row 2: Description, PROJECT TEAM avatar stack (right-aligned)

**Filter bar:**
- List view: status pills (All Tasks / Todo / In Progress / Done) + All Assignees dropdown
- Board view: All Assignees dropdown only (status = columns, filter redundant)

**List view:**
- Tasks grouped by status: Todo (expanded), In Progress (expanded), Done (collapsed by default)
- Each group header: chevron + status name + count, collapsible
- Each row: StatusIcon (clickable → optimistic status cycle) + title + description + priority badge + assignee avatar + due date
- Done tasks: strikethrough + muted gray text
- Click row → opens TaskDrawer pre-filled for edit
- Empty state: centered SVG + "No tasks yet" + "Create the first task →"

**Board view:**
- 3 columns: Todo (gray), In Progress (indigo), Done (green)
- Each column: sticky header + scrollable card stack + `+ Add Task` ghost button at bottom
- Cards: title + description + priority badge + assignee avatar + due date (red if overdue)
- Drag and drop via @dnd-kit/core — optimistic update on drop, revert + toast on error
- Empty column: dashed placeholder "No tasks"
- View preference persisted to localStorage per project

### 4. My Tasks (`/my-tasks`)
- Tasks grouped by project, each group collapsible
- Group header: project name + project status badge + task count → clicking project name navigates to project detail
- Same task row style as Project Detail list view
- Sorting: overdue first → due date asc → done last
- Status filter pills at top (applies across all groups)
- No assignee filter (already scoped to current user)
- No Create Task button (tasks created from within projects)
- Empty state case 1: "You're all caught up" (no tasks at all)
- Empty state case 2: "No tasks match this filter" + "Clear filter" link

### 5. Team (`/team`)
- 3-column responsive member card grid
- Each card: avatar (48px) + name + email + three stat pills (○ Todo / ◑ In Progress / ✓ Done counts)
- Card click → navigates to `/team/:userId`
- Empty state: "No team members yet"

### 6. Member Tasks (`/team/:userId`)
- Identical layout to My Tasks but scoped to the selected user
- H1 = member's name, subtitle = "Tasks assigned to [Name]"
- `← Back to Team` link top left
- Reuse MyTasks component with `userId` prop

### 7. Settings (`/settings`)
- Secondary nav: Profile / Security / Appearance (sticky left column, desktop only)
- **Profile section:** name + email fields, initials-based avatar, Save Changes button with inline success/error feedback
- **Security section:** current password + new password + confirm password, show/hide toggle on all three, Update Password button
- **Appearance section:** Light / Dark / System theme cards, selecting applies immediately + persists to localStorage
- **Danger Zone:** Delete Account button → confirmation modal requiring email re-entry

---

## Shared Components

### Sidebar
- Fixed, 240px wide
- Logo top
- Nav items: Projects, My Tasks, Team, Settings — active item: indigo filled background
- `+ New Project` button pinned to bottom above user identity block
- User identity block: avatar + name + email at very bottom

### TaskDrawer (Create + Edit)
- Right-side slide-in, 480px wide, full-width mobile
- Fields: Title (required), Description (optional), Status (segmented), Priority (segmented), Assignee (dropdown), Due Date (date picker)
- Footer: Cancel (ghost) + Create Task / Save Changes (indigo filled) with spinner
- Edit mode: pre-filled from existing task data
- Resets and closes on successful submit

### StatusIcon
- SVG-based, not checkboxes
- Todo: hollow gray circle
- In Progress: half-filled indigo (left half solid, right transparent with indigo stroke)
- Done: solid green circle + white checkmark
- Clickable in list view to cycle status → optimistic update → revert on error

### CreateProjectModal / EditProjectModal
- Centered dialog, 480px
- Create: name (required) + description (optional)
- Edit: same fields pre-filled + Danger Zone with inline delete confirmation (no nested modal)

---

## State Management

### Zustand auth store (`src/store/auth.ts`)
```ts
{
  user: { id, name, email } | null
  token: string | null
  login: (user, token) => void   // persists to localStorage
  logout: () => void             // clears localStorage + redirects
}
```

### TanStack Query
- All server data fetched and cached via TanStack Query hooks
- Optimistic updates on task status change: `onMutate` → update cache → `onError` → rollback
- Query invalidation after create/edit/delete mutations

---

## API Client (`src/api/client.ts`)
```ts
// Base wrapper that auto-attaches JWT
const apiFetch = (path, options) => {
  const token = useAuthStore.getState().token
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers
    }
  })
}
```

---

## Key UX Requirements

| Requirement | Implementation |
|---|---|
| Auth persists across refresh | Zustand + localStorage |
| Protected routes | ProtectedRoute wrapper component |
| Loading states visible | TanStack Query `isLoading` → skeleton or spinner |
| Error states visible | TanStack Query `isError` → inline error message |
| No silent failures | Every mutation has `onError` handler + toast |
| Optimistic task status | `useMutation` onMutate/onError pattern |
| Responsive (375px + 1280px) | Tailwind responsive prefixes throughout |
| No console errors in prod build | `vite build` must be clean |

---

## Docker

```dockerfile
# Stage 1 — build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2 — serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

`nginx.conf` must include `try_files $uri /index.html` for React Router to work.

---

## Bonus Features (implement after core is complete)

| Bonus | Implementation |
|---|---|
| Drag-and-drop status change | @dnd-kit/core on board view |
| Dark mode | Tailwind `dark:` classes + localStorage preference |
| Real-time task updates | SSE endpoint on backend + EventSource on frontend |

---

## Implementation Order

1. Auth pages (Login + Register) + Zustand store + API client
2. Sidebar layout + ProtectedRoute + routing
3. Projects page + CreateProjectModal
4. Project Detail — list view only first
5. TaskDrawer (create + edit)
6. Optimistic status update on TaskRow
7. Board view + drag and drop
8. My Tasks page
9. Team page + Member Tasks page
10. Settings page
11. EditProjectModal + delete confirmation
12. Empty states everywhere
13. Dark mode (bonus)
14. SSE real-time (bonus, only if backend supports it)