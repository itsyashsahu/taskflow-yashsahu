import { useQuery } from "@tanstack/react-query"
import { usersApi } from "~/api/users"
import { userKeys } from "~/api/query-keys"

export { userKeys }

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