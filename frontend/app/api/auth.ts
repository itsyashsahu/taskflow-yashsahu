import { api, requestJson } from "./client"

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
    return requestJson(api.auth.login.$post({ json: { email, password } }))
  },

  register: async (
    name: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    return requestJson(api.auth.register.$post({ json: { name, email, password } }))
  },
}