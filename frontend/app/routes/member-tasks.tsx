import { Link, useParams } from "react-router"
import { ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { Badge } from "~/components/ui/badge"
import { useUserTasks, useUsers } from "~/api/hooks"
import { PageHeader, PageState } from "~/components/common"

export default function MemberTasks() {
  const { userId } = useParams<{ userId: string }>()
  const { data: userTasks, isLoading, isError, error } = useUserTasks(userId || "")
  const { data: users } = useUsers()

  const member = users?.find((u) => u.id === userId)

  if (!userId) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-destructive">Invalid user ID</p>
      </div>
    )
  }

  if (isLoading) {
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

  if (isError || !userTasks) {
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const totalTasks = userTasks.projects.reduce(
    (acc, p) => acc + p.tasks.length,
    0
  )

  return (
    <div className="p-4 sm:p-6">
      <Link
        to="/team"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Team
      </Link>

      <PageHeader
        title={userTasks.user.name}
        description={`Tasks assigned to ${userTasks.user.name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{userTasks.user.todo_count} Todo</Badge>
            <Badge variant="secondary">
              {userTasks.user.in_progress_count} In Progress
            </Badge>
            <Badge variant="secondary">{userTasks.user.done_count} Done</Badge>
          </div>
        }
      />

      {totalTasks > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {userTasks.projects.map((project) => (
            <div
              key={project.project_id}
              className="overflow-hidden rounded-lg border border-border"
            >
              <Link
                to={`/projects/${project.project_id}`}
                className="flex items-center gap-2 px-3 py-3 hover:bg-muted/50"
              >
                <span className="font-medium">{project.project_name}</span>
                <Badge variant="secondary">{project.tasks.length}</Badge>
              </Link>
              <div className="border-t border-border">
                {project.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-2 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <span
                      className={`size-2 rounded-full ${
                        task.status === "done"
                          ? "bg-emerald-500"
                          : task.status === "in_progress"
                          ? "bg-indigo-500"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <span className={task.status === "done" ? "text-muted-foreground line-through" : ""}>
                      {task.title}
                    </span>
                    <Badge variant="secondary" className="capitalize sm:ml-auto">
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <PageState
          title="No tasks assigned"
          description={`${member?.name || "This member"} has no tasks assigned to them.`}
        />
      )}
    </div>
  )
}