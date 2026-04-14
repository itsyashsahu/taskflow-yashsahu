import { apiFetch } from "./client"

export interface Project {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
  todo_count?: number
  in_progress_count?: number
  done_count?: number
}

export interface ProjectWithTasks extends Project {
  tasks: Task[]
}

export interface Task {
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
  assignee_name?: string | null
  assignee_email?: string | null
}

export interface CreateProjectInput {
  name: string
  description?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  status?: "todo" | "in_progress" | "done"
  priority?: "low" | "medium" | "high"
  assignee_id?: string | null
  due_date?: string | null
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: "todo" | "in_progress" | "done"
  priority?: "low" | "medium" | "high"
  assignee_id?: string | null
  due_date?: string | null
}

export const projectsApi = {
  list: async (): Promise<{ projects: Project[] }> => {
    return apiFetch<{ projects: Project[] }>("/projects")
  },

  get: async (id: string): Promise<{ project: ProjectWithTasks }> => {
    return apiFetch<{ project: ProjectWithTasks }>(`/projects/${id}`)
  },

  create: async (
    data: CreateProjectInput
  ): Promise<{ project: Project }> => {
    return apiFetch<{ project: Project }>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (
    id: string,
    data: UpdateProjectInput
  ): Promise<{ project: Project }> => {
    return apiFetch<{ project: Project }>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/projects/${id}`, {
      method: "DELETE",
    })
  },

  getStats: async (
    id: string
  ): Promise<{
    total: number
    by_status: { todo: number; in_progress: number; done: number }
    by_assignee: { user_id: string; name: string; count: number }[]
  }> => {
    return apiFetch(`/projects/${id}/stats`)
  },

  listTasks: async (
    projectId: string,
    filters?: { status?: string; assignee?: string }
  ): Promise<{ tasks: Task[] }> => {
    const params = new URLSearchParams()
    if (filters?.status) params.set("status", filters.status)
    if (filters?.assignee) params.set("assignee", filters.assignee)
    const query = params.toString()
    return apiFetch<{ tasks: Task[] }>(
      `/projects/${projectId}/tasks${query ? `?${query}` : ""}`
    )
  },

  createTask: async (
    projectId: string,
    data: CreateTaskInput
  ): Promise<{ task: Task }> => {
    return apiFetch<{ task: Task }>(`/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
}