import type { ReactNode } from "react"

import { cn } from "~/lib/utils"

interface PageStateProps {
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
  variant?: "default" | "destructive"
  className?: string
}

export function PageState({
  title,
  description,
  icon,
  action,
  variant = "default",
  className,
}: PageStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-16 text-center",
        variant === "destructive"
          ? "border-destructive/50 bg-destructive/10"
          : "border-border",
        className
      )}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3
        className={cn(
          "mb-1 text-lg font-semibold",
          variant === "destructive" && "text-destructive"
        )}
      >
        {title}
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}