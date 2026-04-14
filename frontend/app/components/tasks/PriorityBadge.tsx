import { Badge } from "~/components/ui/badge"
import type { Task } from "~/api/projects"

interface PriorityBadgeProps {
  priority: Task["priority"]
}

const priorityConfig = {
  low: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Low" },
  medium: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "Medium" },
  high: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "High" },
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority]

  return (
    <Badge variant="secondary" className={`${config.color} border-0`}>
      <span className={`mr-1.5 size-1.5 rounded-full ${config.color.replace("bg-", "bg-").replace("text-", "text-")}`} />
      {config.label}
    </Badge>
  )
}