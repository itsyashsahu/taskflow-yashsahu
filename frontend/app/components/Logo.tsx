import { Link } from "react-router"
import LogoSvg from "~/assests/logo/logo.svg?react"

export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <Link to="/projects" className="flex items-center gap-2">
      <LogoSvg className={className} />
    </Link>
  )
}
