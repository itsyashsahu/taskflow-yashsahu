import { apiFetch, BASE_URL } from "./client"

export interface User {
  id: string
  name: string
  email: string
  created_at?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ApiError {
  error: string
  fields?: Record<string, string>
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  },

  register: async (
    name: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    return apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
  },
}