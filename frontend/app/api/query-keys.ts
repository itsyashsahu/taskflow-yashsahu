export const PROJECTS_KEY = ["projects"]

export const projectKeys = {
  all: PROJECTS_KEY,
  list: () => [...PROJECTS_KEY, "list"],
  detail: (id: string) => [...PROJECTS_KEY, "detail", id],
  tasks: (id: string) => [...PROJECTS_KEY, "tasks", id],
}

export const USERS_KEY = ["users"]

export const userKeys = {
  all: USERS_KEY,
  list: () => [...USERS_KEY, "list"],
  tasks: (id: string) => [...USERS_KEY, "tasks", id],
}

export const AUTH_KEY = ["auth"]

export const authKeys = {
  me: () => [...AUTH_KEY, "me"],
}