import { Outlet } from "react-router"
import { Sidebar } from "~/components/layout/Sidebar"
import { ProtectedRoute } from "~/components/layout/ProtectedRoute"

export default function Layout() {
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