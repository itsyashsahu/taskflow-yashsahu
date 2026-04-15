import { hc } from "hono/client"
import type { AppType } from "../../../backend/src/app"

import { useAuthStore } from "~/store/auth"

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"
let isRedirectingToLogin = false

export const api = hc<AppType>(BASE_URL, {
  headers: () => {
    const token = useAuthStore.getState().token
    const headers: Record<string, string> = {}

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  },
})

type ResponseLike = {
  ok: boolean
  status: number
  json: () => Promise<any>
}

export const requestJson = async <T>(responsePromise: Promise<ResponseLike>): Promise<T> => {
  const response = await responsePromise

  const isAppRoute = window.location.pathname.startsWith("/app") || window.location.pathname === "/"

  if (response.status === 401) {
    useAuthStore.getState().logout()

    if (isAppRoute) {
      const onLoginPage = window.location.pathname === "/login"

      if (!onLoginPage && !isRedirectingToLogin) {
        isRedirectingToLogin = true
        window.location.replace("/login")
      }
    }

    return {} as T
  }

  if (response.status === 404) {
    return {} as T
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const error = new Error(errorData.error || `HTTP error ${response.status}`);
    (error as any).status = response.status;
    (error as any).fields = errorData.fields;
    throw error
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}