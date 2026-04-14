import { apiFetch } from "./client"

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

export const usersApi = {
  list: async (): Promise<{ users: User[] }> => {
    return apiFetch<{ users: User[] }>("/users")
  },

  getTasks: async (userId: string): Promise<UserWithTasks> => {
    return apiFetch<UserWithTasks>(`/users/${userId}/tasks`)
  },
}