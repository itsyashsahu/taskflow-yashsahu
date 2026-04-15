import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { projectsApi, type CreateProjectInput, type UpdateProjectInput, type Task, type CreateTaskInput, type UpdateTaskInput } from "~/api/projects"
import { tasksApi } from "~/api/tasks"
import type { Project, ProjectWithTasks } from "~/api/projects"
import { projectKeys, userKeys } from "~/api/query-keys"

export { projectKeys }

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const response = await projectsApi.list()
      return response.projects
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const response = await projectsApi.get(id)
      return response.project
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProjectInput) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectInput }) =>
      projectsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
  })
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: projectKeys.tasks(projectId),
    queryFn: async () => {
      const response = await projectsApi.listTasks(projectId)
      return response.tasks
    },
    enabled: !!projectId,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string
      data: CreateTaskInput
    }) => projectsApi.createTask(projectId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data, projectId }: { id: string; data: UpdateTaskInput; projectId: string }) =>
      tasksApi.update(id, data),
    onMutate: async ({ id, data, projectId }) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(projectId) })
      const previousProject = queryClient.getQueryData<ProjectWithTasks>(projectKeys.detail(projectId))
      if (previousProject) {
        const updatedTasks = (previousProject.tasks ?? []).map((task) =>
          task.id === id ? { ...task, ...data } : task
        )
        queryClient.setQueryData(projectKeys.detail(projectId), {
          ...previousProject,
          tasks: updatedTasks,
        })
      }
      return { previousProject }
    },
    onError: (_, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(
          projectKeys.detail(variables.projectId),
          context.previousProject
        )
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      tasksApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}