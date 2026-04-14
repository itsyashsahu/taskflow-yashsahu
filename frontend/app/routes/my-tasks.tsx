import { useState } from "react"
import { Link, useSearchParams } from "react-router"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { TaskRow } from "~/components/tasks"
import { TaskDrawer } from "~/components/tasks"
import { useUsers } from "~/api/hooks"
import type { Task } from "~/api/projects"
import { toast } from "sonner"

export default function MyTasks() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false)

  const { data: users, isLoading, isError, error } = useUsers()

  const toggleGroup = (group: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(group)) {
      newCollapsed.delete(group)
    } else {
      newCollapsed.add(group)
    }
    setCollapsedGroups(newCollapsed)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Error loading tasks</p>
          <p className="text-sm">{error?.message || "Please try again later"}</p>
        </div>
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold">My Tasks</h1>
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16">
          <h3 className="mb-1 text-lg font-semibold">You're all caught up</h3>
          <p className="text-sm text-muted-foreground">
            You have no tasks assigned to you
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground">
          Tasks assigned to you across all projects
        </p>
      </div>

      <div className="mb-4">
        <div className="flex rounded-lg border border-border p-1">
          {["all", "todo", "in_progress", "done"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status === "all" ? "All Tasks" : status.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {users.map((user) => {
          const userTasks = user.todo_count + user.in_progress_count + user.done_count
          const filteredCount =
            statusFilter === "all"
              ? userTasks
              : statusFilter === "todo"
              ? user.todo_count
              : statusFilter === "in_progress"
              ? user.in_progress_count
              : user.done_count

          if (filteredCount === 0) return null

          const groupKey = `user-${user.id}`
          const isCollapsed = collapsedGroups.has(groupKey)

          return (
            <div key={user.id} className="rounded-lg border border-border">
              <button
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50"
                onClick={() => toggleGroup(groupKey)}
              >
                {isCollapsed ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
                <span className="font-medium">{user.name}</span>
                <Badge variant="secondary">{filteredCount}</Badge>
                <Link
                  to={`/team/${user.id}`}
                  className="ml-auto text-sm text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View profile
                </Link>
              </button>

              {!isCollapsed && (
                <div className="border-t border-border">
                  {userTasks === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                      No tasks match this filter
                    </p>
                  ) : (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                      Task list would appear here
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {statusFilter !== "all" && users.every((u) => {
        const count = statusFilter === "todo"
          ? u.todo_count
          : statusFilter === "in_progress"
          ? u.in_progress_count
          : u.done_count
        return count === 0
      }) && (
        <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-border py-8">
          <h3 className="mb-1 text-lg font-semibold">No tasks match this filter</h3>
          <Button
            variant="link"
            onClick={() => setStatusFilter("all")}
            className="text-primary"
          >
            Clear filter
          </Button>
        </div>
      )}
    </div>
  )
}