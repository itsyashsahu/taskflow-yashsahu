import { Navigate, useLocation } from "react-router"
import { useAuth } from "~/store/auth"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, _hasHydrated } = useAuth()
  const location = useLocation()

  if (!_hasHydrated) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}