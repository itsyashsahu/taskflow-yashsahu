import { Link } from "react-router"
import LogoSvg from "~/assests/logo/logo.svg?react"
import { cn } from "~/lib/utils"

type LogoProps = {
  className?: string
  containerClassName?: string
  to?: string
}

export function Logo({
  className = "h-9 w-auto",
  containerClassName,
  to = "/app",
}: LogoProps) {
  return (
    <Link to={to} className={cn("inline-flex items-center", containerClassName)}>
      <LogoSvg className={cn("block h-full w-auto max-w-full shrink-0", className)} />
    </Link>
  )
}
