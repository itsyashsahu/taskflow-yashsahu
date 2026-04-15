import { Outlet } from "react-router"
import { useCallback, useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Sidebar, MobileSidebar } from "~/components/layout/Sidebar"
import { ProtectedRoute } from "~/components/layout/ProtectedRoute"
import { useAuth, useAuthStore } from "~/store/auth"
import { Loader2 } from "lucide-react"
import { Logo } from "~/components/Logo"
import { BASE_URL } from "~/api/client"

let eventSourceInstance: EventSource | null = null

export default function Layout() {
  const { _hasHydrated } = useAuth()
  const queryClient = useQueryClient()
  const connectedRef = useRef(false)

  const connect = useCallback(() => {
    console.log("[SSE] connect called, connectedRef:", connectedRef.current)

    if (connectedRef.current && eventSourceInstance) {
      console.log("[SSE] Already connected, skipping")
      return
    }

    const state = useAuthStore.getState()
    console.log("[SSE] State:", { _hasHydrated: state._hasHydrated, hasToken: !!state.token })

    if (!state._hasHydrated || !state.token) {
      console.log("[SSE] Not ready yet")
      return
    }

    console.log("[SSE] Creating new EventSource")
    connectedRef.current = true

    eventSourceInstance = new EventSource(`${BASE_URL}/data-updates?token=${state.token}`, {
      withCredentials: true,
    })

    eventSourceInstance.onopen = () => {
      console.log("[SSE] Connection opened")
    }

    eventSourceInstance.onmessage = async (event) => {
      console.log("[SSE] Received message:", event.data)
      try {
        const data = JSON.parse(event.data)
        if (data.type !== "heartbeat" && data.type !== "connected") {
          console.log("[SSE] Processing event:", data)
          const { projectKeys, userKeys } = await import("~/api/query-keys")
          const keys: any[][] = []

          switch (data.resource) {
            case "project":
              keys.push(projectKeys.list())
              keys.push(projectKeys.detail(data.id))
              if (data.data?.projectId) {
                keys.push(projectKeys.tasks(data.data.projectId))
              }
              keys.push(projectKeys.tasks(data.id))
              break
            case "task":
              if (data.data?.projectId) {
                keys.push(projectKeys.detail(data.data.projectId))
                keys.push(projectKeys.tasks(data.data.projectId))
              }
              keys.push(userKeys.list())
              keys.push(userKeys.tasks(data.id))
              break
            case "user":
              keys.push(userKeys.list())
              break
          }

          console.log("[SSE] Invalidating keys:", keys)
          keys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key })
          })
        }
      } catch (e) {
        console.error("[SSE] Failed to parse event:", e)
      }
    }

    eventSourceInstance.onerror = (err) => {
      console.log("[SSE] Connection error:", err)
      eventSourceInstance?.close()
      eventSourceInstance = null
      connectedRef.current = false
    }

    return () => {
      console.log("[SSE] Cleanup called")
      eventSourceInstance?.close()
      eventSourceInstance = null
      connectedRef.current = false
    }
  }, [queryClient])

  useEffect(() => {
    console.log("[SSE] useEffect triggered")
    const cleanup = connect()
    return () => {
      console.log("[SSE] useEffect cleanup")
      cleanup?.()
    }
  }, [connect])

  if (!_hasHydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-svh bg-background">
        <div className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
          <MobileSidebar />
          <Logo className="h-7" />
        </div>
        <Sidebar />
        <main className="flex-1 lg:ml-60">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  )
}