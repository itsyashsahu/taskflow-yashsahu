import { Navigate } from "react-router"
import { useAuth } from "~/store/auth"

export default function Root() {
  const { isAuthenticated, _hasHydrated } = useAuth()

  if (!_hasHydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return isAuthenticated ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />
}