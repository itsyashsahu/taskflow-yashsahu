import { Outlet } from "react-router"
import { Sidebar, MobileSidebar } from "~/components/layout/Sidebar"
import { ProtectedRoute } from "~/components/layout/ProtectedRoute"
import { useAuth } from "~/store/auth"
import { Loader2 } from "lucide-react"
import { Logo } from "~/components/Logo"
import { useDataUpdates } from "~/api/hooks"

export default function Layout() {
  const { _hasHydrated } = useAuth()
  useDataUpdates()

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