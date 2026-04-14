import { useState, useEffect } from "react"
import { useSearchParams } from "react-router"
import { Plus } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import {
  ProjectCard,
  CreateProjectModal,
  EditProjectModal,
} from "~/components/projects"
import { useProjects } from "~/api/hooks"
import { toast } from "sonner"
import type { Project } from "~/api/projects"

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  const { data: projects, isLoading, isError, error } = useProjects()

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setCreateOpen(true)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const handleDeleteProject = (project: Project) => {
    toast.error("Delete functionality is in the Edit modal")
    setEditProject(project)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Error loading projects</p>
          <p className="text-sm">{error?.message || "Please try again later"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Create Project
        </Button>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={setEditProject}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16">
          <div className="mb-4 rounded-full bg-muted p-4">
            <svg
              className="size-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-semibold">No projects yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Get started by creating your first project
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Start a Project
          </Button>
        </div>
      )}

      <CreateProjectModal open={createOpen} onOpenChange={setCreateOpen} />

      <EditProjectModal
        project={editProject}
        open={!!editProject}
        onOpenChange={(open) => !open && setEditProject(null)}
      />
    </div>
  )
}