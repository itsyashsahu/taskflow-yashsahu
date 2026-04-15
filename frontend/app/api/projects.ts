import { api, requestJson } from "./client"

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
    return requestJson(api.projects.$get())
  },

  get: async (id: string): Promise<{ project: ProjectWithTasks }> => {
    return requestJson(api.projects[":id"].$get({ param: { id } }))
  },

  create: async (
    data: CreateProjectInput
  ): Promise<{ project: Project }> => {
    return requestJson(api.projects.$post({ json: data }))
  },

  update: async (
    id: string,
    data: UpdateProjectInput
  ): Promise<{ project: Project }> => {
    return requestJson(
      api.projects[":id"].$patch({ param: { id }, json: data } as any)
    )
  },

  delete: async (id: string): Promise<void> => {
    return requestJson(api.projects[":id"].$delete({ param: { id } }))
  },

  getStats: async (
    id: string
  ): Promise<{
    total: number
    by_status: { todo: number; in_progress: number; done: number }
    by_assignee: { user_id: string; name: string; count: number }[]
  }> => {
    return requestJson(api.projects[":id"].stats.$get({ param: { id } }))
  },

  listTasks: async (
    projectId: string,
    filters?: { status?: string; assignee?: string }
  ): Promise<{ tasks: Task[] }> => {
    return requestJson(
      api.projects[":id"].tasks.$get({
        param: { id: projectId },
        query: filters ?? {},
      } as any)
    )
  },

  createTask: async (
    projectId: string,
    data: CreateTaskInput
  ): Promise<{ task: Task }> => {
    return requestJson(
      api.projects[":id"].tasks.$post({
        param: { id: projectId },
        json: data,
      } as any)
    )
  },
}