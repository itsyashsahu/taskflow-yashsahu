import { Navigate } from "react-router"
import { useAuth } from "~/store/auth"

export default function Home() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />
  }

  return <Navigate to="/login" replace />
}