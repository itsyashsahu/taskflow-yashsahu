import { useState } from "react"
import { Link } from "react-router"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { TaskRow } from "~/components/tasks"
import { TaskDrawer } from "~/components/tasks"
import { useUserTasks } from "~/api/hooks"
import type { Task } from "~/api/projects"
import { useAuth } from "~/store/auth"
import { PageHeader, PageState } from "~/components/common"

export default function MyTasks() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingProjectId, setEditingProjectId] = useState<string>("")
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false)

  const { user, _hasHydrated } = useAuth()
  const {
    data: userTasks,
    isLoading,
    isError,
    error,
  } = useUserTasks(user?.id || "")

  const toggleGroup = (group: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(group)) {
      newCollapsed.delete(group)
    } else {
      newCollapsed.add(group)
    }
    setCollapsedGroups(newCollapsed)
  }

  if (!_hasHydrated || isLoading) {
    return (
      <div className="p-4 sm:p-6">
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
      <div className="p-4 sm:p-6">
        <PageState
          variant="destructive"
          title="Error loading tasks"
          description={error?.message || "Please try again later"}
        />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 sm:p-6">
        <PageState
          variant="destructive"
          title="Authentication required"
          description="Please log in to view your tasks."
        />
      </div>
    )
  }

  if (!userTasks) {
    return null
  }

  const projects = userTasks.projects
    .map((project) => ({
      ...project,
      tasks: project.tasks.filter((task) =>
        statusFilter === "all" ? true : task.status === statusFilter
      ),
    }))
    .filter((project) => project.tasks.length > 0)

  const totalFilteredTasks = projects.reduce(
    (acc, project) => acc + project.tasks.length,
    0
  )

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="My Tasks"
        description="Tasks assigned to you across all projects."
        actions={<Badge variant="secondary">{totalFilteredTasks} Tasks</Badge>}
      />

      <div className="mb-4">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border p-1">
          {["all", "todo", "in_progress", "done"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="flex-1 capitalize sm:flex-none"
            >
              {status === "all" ? "All Tasks" : status.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {projects.length === 0 ? (
        <PageState
          title="You're all caught up"
          description={
            statusFilter === "all"
              ? "You have no tasks assigned to you."
              : "No tasks match this status filter."
          }
          action={
            statusFilter !== "all" ? (
              <Button variant="link" onClick={() => setStatusFilter("all")}>
                Clear filter
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const groupKey = `project-${project.project_id}`
            const isCollapsed = collapsedGroups.has(groupKey)

            return (
              <div key={project.project_id} className="overflow-hidden rounded-lg border border-border">
                <button
                  className="flex w-full flex-wrap items-center gap-3 p-3 text-left hover:bg-muted/50"
                  onClick={() => toggleGroup(groupKey)}
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-4 shrink-0" />
                  ) : (
                    <ChevronDown className="size-4 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 font-medium">{project.project_name}</span>
                  <Badge variant="secondary">{project.tasks.length}</Badge>
                  <Link
                    to={`/projects/${project.project_id}`}
                    className="ml-0 text-sm text-primary hover:underline sm:ml-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open project
                  </Link>
                </button>

              {!isCollapsed && (
                <div className="border-t border-border">
                  {project.tasks.map((task) => {
                    const normalizedTask: Task = {
                      ...task,
                      assignee_name: userTasks.user.name,
                      assignee_email: userTasks.user.email,
                    }

                    return (
                      <TaskRow
                        key={task.id}
                        task={normalizedTask}
                        projectId={project.project_id}
                        onEdit={(selectedTask) => {
                          setEditingProjectId(project.project_id)
                          setEditingTask(selectedTask)
                          setTaskDrawerOpen(true)
                        }}
                      />
                    )
                  })}
                </div>
              )}
              </div>
            )
          })}
        </div>
      )}

      <TaskDrawer
        projectId={editingProjectId}
        task={editingTask}
        open={taskDrawerOpen}
        onOpenChange={(open) => {
          setTaskDrawerOpen(open)
          if (!open) {
            setEditingTask(null)
            setEditingProjectId("")
          }
        }}
      />
    </div>
  )
}