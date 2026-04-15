import { Outlet } from "react-router"
import { AuthLayout } from "~/components/layout/AuthLayout"

export default function AuthLayoutRoute() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  )
}