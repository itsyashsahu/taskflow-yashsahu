import { type RouteConfig, index, route, layout } from "@react-router/dev/routes"

export default [
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  layout("routes/layout.tsx", [
    route("projects", "routes/projects.tsx"),
    route("projects/:id", "routes/project-detail.tsx"),
    route("my-tasks", "routes/my-tasks.tsx"),
    route("team", "routes/team.tsx"),
    route("team/:userId", "routes/member-tasks.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
  index("routes/home.tsx"),
] satisfies RouteConfig