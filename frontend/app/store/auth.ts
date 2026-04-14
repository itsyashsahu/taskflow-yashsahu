import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useNavigate } from "react-router"

export interface User {
  id: string
  name: string
  email: string
  created_at?: string
}

interface AuthState {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "taskflow-auth",
    }
  )
)

export const useAuth = () => {
  const { user, token } = useAuthStore()
  return { user, token, isAuthenticated: !!token }
}

export const useLogout = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  return () => {
    logout()
    navigate("/login")
  }
}