import { apiFetch } from "./client"
import type { Task, UpdateTaskInput } from "./projects"

export const tasksApi = {
  update: async (id: string, data: UpdateTaskInput): Promise<{ task: Task }> => {
    return apiFetch<{ task: Task }>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/tasks/${id}`, {
      method: "DELETE",
    })
  },
}