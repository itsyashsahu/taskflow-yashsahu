import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react"
import { usersApi } from "~/api/users"
import { useAuthStore } from "~/store/auth"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => Promise<void>
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: async () => {},
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "taskflow-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Initialize from localStorage to avoid hydration mismatch
    if (typeof window === "undefined") {
      return defaultTheme
    }
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme
  })

  const [mounted, setMounted] = useState(false)

  // Initialize theme synchronously before paint (prevents flash)
  useLayoutEffect(() => {
    const savedTheme = (localStorage.getItem(storageKey) as Theme) || defaultTheme
    applyTheme(savedTheme)
  }, [])

  // Sync theme from backend on mount
  useEffect(() => {
    const syncThemeFromBackend = async () => {
      const token = useAuthStore.getState().token
      if (!token) {
        return
      }

      try {
        const { user } = await usersApi.getCurrentUser()
        if (user.theme && user.theme !== theme) {
          setThemeState(user.theme)
          applyTheme(user.theme)
        }
      } catch (error) {
        // Silently fail, use localStorage value
      }
    }

    syncThemeFromBackend()
    setMounted(true)
  }, [])

  // Apply theme to DOM when it changes
  useEffect(() => {
    if (!mounted) return

    applyTheme(theme)
  }, [theme, mounted])

  const setTheme = async (newTheme: Theme) => {
    // Update local state and localStorage immediately
    setThemeState(newTheme)
    localStorage.setItem(storageKey, newTheme)

    // Show theme change immediately
    applyTheme(newTheme)

    // Sync to backend in background
    try {
      const token = useAuthStore.getState().token
      if (token) {
        await usersApi.updateTheme(newTheme)
      }
    } catch (error) {
      console.error("Failed to save theme to backend:", error)
      // Theme is still saved to localStorage, so no silent failure
    }
  }

  const value = {
    theme,
    setTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}

export function applyTheme(theme: Theme) {
  const root = window.document.documentElement

  root.classList.remove("light", "dark")

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    root.classList.add(systemTheme)
  } else {
    root.classList.add(theme)
  }
}
