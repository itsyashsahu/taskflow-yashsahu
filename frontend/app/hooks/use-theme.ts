import { useEffect, useState } from "react"
import { useAuth } from "~/store/auth"
import { usersApi } from "~/api/users"

export function useTheme() {
  const { _hasHydrated } = useAuth()
  const [theme, setTheme] = useState<"light" | "dark" | "system" | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initTheme = async () => {
      if (!_hasHydrated) return

      try {
        // Try to load from backend
        const { user } = await usersApi.getCurrentUser()
        const savedTheme = user.theme || "system"
        setTheme(savedTheme)
        applyTheme(savedTheme)
        localStorage.setItem("taskflow-theme", savedTheme)
      } catch (error) {
        // Fallback to localStorage
        const stored = localStorage.getItem("taskflow-theme") as "light" | "dark" | "system" | null
        const fallbackTheme = stored || "system"
        setTheme(fallbackTheme)
        applyTheme(fallbackTheme)
      } finally {
        setLoading(false)
      }
    }

    initTheme()
  }, [_hasHydrated])

  return { theme, loading }
}

export function applyTheme(theme: "light" | "dark" | "system") {
  if (theme === "dark") {
    document.documentElement.classList.add("dark")
  } else if (theme === "light") {
    document.documentElement.classList.remove("dark")
  } else {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }
}
