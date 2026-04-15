import { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useUpdateProject, useDeleteProject } from "~/api/hooks"
import { toast } from "sonner"
import type { Project } from "~/api/projects"

interface EditProjectModalProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectModal({
  project,
  open,
  onOpenChange,
}: EditProjectModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  useEffect(() => {
    if (open && project) {
      setName(project.name)
      setDescription(project.description || "")
    }

    setErrors({})
    setShowDeleteConfirm(false)
    if (!open) {
      setName("")
      setDescription("")
    }
  }, [open, project])

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) {
      newErrors.name = "Project name is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !validateForm()) return

    try {
      await updateProject.mutateAsync({
        id: project.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
        },
      })
      toast.success("Project updated successfully!")
      handleOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to update project")
    }
  }

  const handleDelete = async () => {
    if (!project) return

    try {
      await deleteProject.mutateAsync(project.id)
      toast.success("Project deleted successfully!")
      handleOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project")
    }
  }

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-120">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Make changes to your project.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Project"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full"
              >
                Delete Project
              </Button>
            ) : (
              <div className="flex flex-col gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 w-full">
                <p className="text-sm text-destructive font-medium">
                  Are you sure? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteProject.isPending}
                    className="flex-1"
                  >
                    {deleteProject.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProject.isPending}
                className="flex-1"
              >
                {updateProject.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}