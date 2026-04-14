import { Calendar } from "lucide-react"
import { Card, CardContent } from "~/components/ui/card"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { PriorityBadge } from "./PriorityBadge"
import type { Task } from "~/api/projects"
import { cn } from "~/lib/utils"

interface TaskCardProps {
  task: Task
  onClick: () => void
  isDragging?: boolean
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const isDone = task.status === "done"
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDueDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isDragging && "rotate-2 shadow-lg opacity-90"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <p className={cn("font-medium", isDone && "line-through text-muted-foreground")}>
          {task.title}
        </p>

        {task.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <PriorityBadge priority={task.priority} />

          <div className="flex items-center gap-2">
            {task.assignee_name ? (
              <Avatar className="size-5" title={task.assignee_name}>
                <AvatarFallback className="text-[8px]">
                  {getInitials(task.assignee_name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="size-5 rounded-full border border-dashed border-muted-foreground/30" />
            )}

            {task.due_date && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? "text-destructive" : "text-muted-foreground"
                )}
              >
                <Calendar className="size-3" />
                {formatDueDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}