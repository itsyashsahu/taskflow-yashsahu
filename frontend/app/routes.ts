import { type RouteConfig, route, layout } from "@react-router/dev/routes"

export default [
  layout("routes/auth-layout.tsx", [
    route("login", "routes/login.tsx"),
    route("register", "routes/register.tsx"),
  ]),
  layout("routes/layout.tsx", [
    route("app", "routes/app/home.tsx"),
    route("app/projects", "routes/app/projects/index.tsx"),
    route("app/projects/:id", "routes/app/projects/project-detail.tsx"),
    route("app/my-tasks", "routes/app/my-tasks.tsx"),
    route("app/team", "routes/app/team/index.tsx"),
    route("app/team/:userId", "routes/app/team/member-tasks.tsx"),
    route("app/settings", "routes/app/settings.tsx"),
  ]),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig