import { Calendar } from "lucide-react"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { StatusIcon } from "./StatusIcon"
import { PriorityBadge } from "./PriorityBadge"
import type { Task } from "~/api/projects"
import { useUpdateTask } from "~/api/hooks"
import { toast } from "sonner"
import { cn } from "~/lib/utils"

interface TaskRowProps {
  task: Task
  projectId: string
  onEdit: (task: Task) => void
}

export function TaskRow({ task, projectId, onEdit }: TaskRowProps) {
  const updateTask = useUpdateTask()

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

  const cycleStatus = async () => {
    if (isDone) return

    const nextStatus: Record<string, Task["status"]> = {
      todo: "in_progress",
      in_progress: "done",
    }

    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { status: nextStatus[task.status] },
        projectId,
      })
      toast.success(`Task moved to ${nextStatus[task.status].replace("_", " ")}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to update task")
    }
  }

  const formatDueDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-4 border-b border-border px-4 py-3 transition-colors hover:bg-muted/50",
        isDone && "text-muted-foreground"
      )}
    >
      <div onClick={cycleStatus} className="shrink-0">
        <StatusIcon status={task.status} />
      </div>

      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onEdit(task)}>
        <p className={cn("truncate font-medium", isDone && "line-through")}>
          {task.title}
        </p>
        {task.description && (
          <p className="truncate text-sm text-muted-foreground">
            {task.description}
          </p>
        )}
      </div>

      <div className="shrink-0">
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="shrink-0">
        {task.assignee_name ? (
          <Avatar className="size-6" title={task.assignee_name}>
            <AvatarFallback className="text-[10px]">
              {getInitials(task.assignee_name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="size-6 rounded-full border border-dashed border-muted-foreground/30" />
        )}
      </div>

      {task.due_date && (
        <div
          className={cn(
            "shrink-0 flex items-center gap-1 text-sm",
            isOverdue ? "text-destructive" : "text-muted-foreground"
          )}
        >
          <Calendar className="size-3.5" />
          <span>{formatDueDate(task.due_date)}</span>
        </div>
      )}
    </div>
  )
}