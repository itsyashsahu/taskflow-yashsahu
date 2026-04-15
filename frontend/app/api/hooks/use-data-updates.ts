import { useEffect, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { BASE_URL } from "~/api/client"
import { useAuthStore } from "~/store/auth"
import { projectKeys, userKeys } from "~/api/query-keys"

export type EventAction = "create" | "update" | "delete"
export type ResourceType = "project" | "task" | "user" | "team"

export interface DataEvent {
  action: EventAction
  resource: ResourceType
  id: string
  data?: any
  timestamp: number
}

function getQueryKeysToInvalidate(event: DataEvent) {
  const keys: any[][] = []

  switch (event.resource) {
    case "project":
      keys.push(projectKeys.list())
      keys.push(projectKeys.detail(event.id))
      if (event.data?.projectId) {
        keys.push(projectKeys.tasks(event.data.projectId))
      }
      keys.push(projectKeys.tasks(event.id))
      break
    case "task":
      if (event.data?.projectId) {
        keys.push(projectKeys.detail(event.data.projectId))
        keys.push(projectKeys.tasks(event.data.projectId))
      }
      keys.push(userKeys.list())
      keys.push(userKeys.tasks(event.id))
      break
    case "user":
      keys.push(userKeys.list())
      break
  }

  return keys
}

export function useDataUpdates() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  const connect = useCallback(() => {
    if (!token) return

    const eventSource = new EventSource(`${BASE_URL}/data-updates`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type !== "heartbeat" && data.type !== "connected") {
          const keys = getQueryKeysToInvalidate(data)
          keys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key })
          })
        }
      } catch (e) {
        console.error("Failed to parse SSE event:", e)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [token, queryClient])

  useEffect(() => {
    const cleanup = connect()
    return () => {
      cleanup?.()
    }
  }, [connect])
}