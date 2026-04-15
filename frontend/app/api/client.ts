import { useAuthStore } from "~/store/auth"

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

export const apiFetch = async <T>(
  path: string,
  options?: RequestInit
): Promise<T> => {
  const token = useAuthStore.getState().token
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const error = new Error(errorData.error || `HTTP error ${response.status}`)
    ;(error as any).status = response.status
    ;(error as any).fields = errorData.fields
    throw error
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}