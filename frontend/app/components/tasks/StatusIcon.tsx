import type { Task } from "~/api/projects"

interface StatusIconProps {
  status: Task["status"]
  className?: string
  onClick?: () => void
}

export function StatusIcon({ status, className, onClick }: StatusIconProps) {
  const baseClass = `size-5 shrink-0 ${onClick ? "cursor-pointer hover:opacity-80" : ""} ${className || ""}`

  if (status === "todo") {
    return (
      <svg
        className={baseClass}
        viewBox="0 0 20 20"
        fill="none"
        onClick={onClick}
      >
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
      </svg>
    )
  }

  if (status === "in_progress") {
    return (
      <svg
        className={baseClass}
        viewBox="0 0 20 20"
        fill="none"
        onClick={onClick}
      >
        <circle cx="10" cy="10" r="8" fill="currentColor" className="text-primary" />
        <path
          d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 3a7 7 0 110 14 7 7 0 010-14z"
          fill="currentColor"
          className="text-primary"
          clipRule="evenodd"
          fillRule="evenodd"
        />
      </svg>
    )
  }

  return (
    <svg
      className={baseClass}
      viewBox="0 0 20 20"
      fill="none"
      onClick={onClick}
    >
      <circle cx="10" cy="10" r="8" fill="currentColor" className="text-emerald-500" />
      <path
        d="M6 10l2.5 2.5L14 7"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}