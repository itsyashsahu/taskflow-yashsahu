import { Outlet } from "react-router"
import { Sidebar } from "~/components/layout/Sidebar"
import { ProtectedRoute } from "~/components/layout/ProtectedRoute"
import { useAuth } from "~/store/auth"
import { Loader2 } from "lucide-react"

export default function Layout() {
  const { _hasHydrated } = useAuth()

  if (!_hasHydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-svh">
        <Sidebar />
        <main className="ml-60 flex-1">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  )
}