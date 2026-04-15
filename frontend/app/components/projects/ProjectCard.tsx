import { Link } from "react-router"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Progress } from "~/components/ui/progress"
import type { Project } from "~/api/projects"
import { useAuthStore } from "~/store/auth"

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const { user } = useAuthStore()
  const isOwner = project.owner_id === user?.id

  const totalTasks =
    (project.todo_count || 0) +
    (project.in_progress_count || 0) +
    (project.done_count || 0)
  const doneTasks = project.done_count || 0
  const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0

  const status =
    progress === 100
      ? "Done"
      : progress > 0
      ? "In Progress"
      : "Todo"

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card
      className="group relative overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
      onClick={() => {
        // Only navigate if click is not on the dropdown menu
        // We'll handle this by stopping propagation on the dropdown trigger
      }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <Link
              to={`/app/projects/${project.id}`}
              className="block hover:opacity-80 transition-opacity"
            >
              <h3 className="font-semibold truncate">{project.name}</h3>
              {project.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
            </Link>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 size-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted hover:text-foreground"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => onDelete(project)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="capitalize px-3 py-1 text-sm">
              {status}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{doneTasks}</span>
              <span>/</span>
              <span>{totalTasks}</span>
              <span className="ml-1">tasks</span>
            </div>
          </div>

          <Progress value={progress} className="h-2.5 mt-1" />

          <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
            <Avatar className="size-7">
              <AvatarFallback className="text-[11px]">
                {getInitials(project.name)}
              </AvatarFallback>
            </Avatar>
            <span className="whitespace-nowrap">
              {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}