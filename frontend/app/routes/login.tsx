import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Logo } from "~/components/Logo"
import { useLogin, useRegister } from "~/api/hooks"
import { useAuth } from "~/store/auth"
import { toast } from "sonner"

export default function Login() {
  const { isAuthenticated, _hasHydrated } = useAuth()
  const navigateFn = useNavigate()

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      navigateFn("/projects", { replace: true })
    }
  }, [_hasHydrated, isAuthenticated, navigateFn])

  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loginMutation = useLogin()
  const registerMutation = useRegister()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (isRegister && !name.trim()) {
      newErrors.name = "Name is required"
    }
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format"
    }
    if (!password) {
      newErrors.password = "Password is required"
    } else if (isRegister && password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      if (isRegister) {
        await registerMutation.mutateAsync({ name, email, password })
        toast.success("Account created successfully!")
      } else {
        await loginMutation.mutateAsync({ email, password })
        toast.success("Welcome back!")
      }
      navigateFn("/projects")
    } catch (error: any) {
      toast.error(error.message || "An error occurred")
      if (error.fields) {
        setErrors(error.fields)
      }
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <Logo className="h-10" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isRegister ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {isRegister
              ? "Enter your details to create your account"
              : "Enter your credentials to access your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={isRegister ? "Min 8 characters" : "********"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || registerMutation.isPending}
            >
              {loginMutation.isPending || registerMutation.isPending
                ? "Please wait..."
                : isRegister
                ? "Create account"
                : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                  onClick={() => {
                    setIsRegister(false)
                    setErrors({})
                  }}
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-primary hover:underline"
                  onClick={() => {
                    setIsRegister(true)
                    setErrors({})
                  }}
                >
                  Create one
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}