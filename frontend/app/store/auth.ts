import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"

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
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
}

const clientStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(name)
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return
    localStorage.setItem(name, value)
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem(name)
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "taskflow-auth",
      storage: createJSONStorage(() => clientStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

export const useAuth = () => {
  const { user, token, _hasHydrated } = useAuthStore()
  return { user, token, isAuthenticated: !!token, _hasHydrated }
}

export const useLogout = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)
  return () => {
    logout()
    queryClient.clear()
    navigate("/login", { replace: true })
  }
}