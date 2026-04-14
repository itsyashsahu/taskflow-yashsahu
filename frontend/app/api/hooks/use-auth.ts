import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query"
import { authApi } from "~/api/auth"
import { useAuthStore } from "~/store/auth"
import type { AuthResponse } from "~/api/auth"

export const AUTH_KEY = ["auth"]

export function useLogin() {
  const queryClient = useQueryClient()
  const login = useAuthStore((state) => state.login)

  const mutation = useMutation({
    mutationFn: ({
      email,
      password,
    }: {
      email: string
      password: string
    }) => authApi.login(email, password),
    onSuccess: (data: AuthResponse) => {
      login(data.user, data.token)
      queryClient.setQueryData(AUTH_KEY, data)
    },
  })

  return mutation
}

export function useRegister() {
  const queryClient = useQueryClient()
  const login = useAuthStore((state) => state.login)

  const mutation = useMutation({
    mutationFn: ({
      name,
      email,
      password,
    }: {
      name: string
      email: string
      password: string
    }) => authApi.register(name, email, password),
    onSuccess: (data: AuthResponse) => {
      login(data.user, data.token)
      queryClient.setQueryData(AUTH_KEY, data)
    },
  })

  return mutation
}