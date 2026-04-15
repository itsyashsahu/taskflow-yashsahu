import { hc } from "hono/client"

import { useAuthStore } from "~/store/auth"

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

export const api: any = hc(BASE_URL, {
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

async function readErrorPayload(response: ResponseLike) {
  return response.json().catch(() => ({}))
}

export const requestJson = async <T>(responsePromise: Promise<ResponseLike>): Promise<T> => {
  const response = await responsePromise

  if (response.status === 401) {
    useAuthStore.getState().logout()

    const errorData = await readErrorPayload(response)
    const error = new Error(errorData.error || "unauthorized")
    ;(error as any).status = response.status
    ;(error as any).fields = errorData.fields
    throw error
  }

  if (response.status === 404) {
    return {} as T
  }

  if (!response.ok) {
    const errorData = await readErrorPayload(response)
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