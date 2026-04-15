import { api, requestJson } from "./client"

export interface User {
  id: string
  name: string
  email: string
  created_at: string
  todo_count: number
  in_progress_count: number
  done_count: number
}

export interface UserTask {
  id: string
  title: string
  description: string | null
  status: "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high"
  project_id: string
  creator_id: string
  assignee_id: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface ProjectTasks {
  project_id: string
  project_name: string
  tasks: UserTask[]
}

export interface UserWithTasks {
  user: User
  projects: ProjectTasks[]
}

export interface UserPreferences {
  id: string
  name: string
  email: string
  created_at: string
  theme: "light" | "dark" | "system"
}

export const usersApi = {
  getCurrentUser: async (): Promise<{ user: UserPreferences }> => {
    return requestJson(api.users.me.$get())
  },

  updateTheme: async (
    theme: "light" | "dark" | "system"
  ): Promise<{ user: UserPreferences }> => {
    return requestJson(api.users.theme.$patch({ json: { theme } }))
  },
  list: async (): Promise<{ users: User[] }> => {
    return requestJson(api.users.$get())
  },

  getTasks: async (userId: string): Promise<UserWithTasks> => {
    return requestJson(api.users[":id"].tasks.$get({ param: { id: userId } }))
  },
}
