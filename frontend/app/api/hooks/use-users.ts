import { useQuery } from "@tanstack/react-query"
import { usersApi } from "~/api/users"

export const USERS_KEY = ["users"]
export const userKeys = {
  all: USERS_KEY,
  list: () => [...USERS_KEY, "list"],
  tasks: (userId: string) => [...USERS_KEY, "tasks", userId],
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: async () => {
      const response = await usersApi.list()
      return response.users
    },
  })
}

export function useUserTasks(userId: string) {
  return useQuery({
    queryKey: userKeys.tasks(userId),
    queryFn: () => usersApi.getTasks(userId),
    enabled: !!userId,
  })
}