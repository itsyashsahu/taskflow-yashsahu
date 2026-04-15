import { api, requestJson } from "./client"
import type { Task, UpdateTaskInput } from "./projects"

export const tasksApi = {
  update: async (id: string, data: UpdateTaskInput): Promise<{ task: Task }> => {
    return requestJson(
      api.tasks[":id"].$patch({ param: { id }, json: data } as any)
    )
  },

  delete: async (id: string): Promise<void> => {
    return requestJson(api.tasks[":id"].$delete({ param: { id } }))
  },
}