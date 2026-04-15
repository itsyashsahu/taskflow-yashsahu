import { useState, useEffect } from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Calendar } from "~/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import type { Task, CreateTaskInput } from "~/api/projects"
import { useCreateTask, useDeleteTask, useUpdateTask, useUsers } from "~/api/hooks"
import { toast } from "sonner"
import { cn } from "~/lib/utils"

interface TaskDrawerProps {
  projectId: string
  task: Task | null
  currentUserId?: string | null
  projectOwnerId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusOptions = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
]

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

function parseDateInput(value: string): Date | undefined {
  if (!value) return undefined

  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined

  return new Date(year, month - 1, day)
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDateLabel(value: string): string {
  const date = parseDateInput(value)
  if (!date) return "Pick a due date"

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function TaskDrawer({
  projectId,
  task,
  currentUserId,
  projectOwnerId,
  open,
  onOpenChange,
}: TaskDrawerProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<CreateTaskInput["status"]>("todo")
  const [priority, setPriority] =
    useState<CreateTaskInput["priority"]>("medium")
  const [assigneeId, setAssigneeId] = useState<string>("")
  const [dueDate, setDueDate] = useState("")
  const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: users } = useUsers()
  const createTask = useCreateTask()
  const deleteTask = useDeleteTask()
  const updateTask = useUpdateTask()

  const isEditing = !!task
  const canDeleteTask = !!(
    task &&
    currentUserId &&
    (projectOwnerId === currentUserId || task.creator_id === currentUserId)
  )

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title)
        setDescription(task.description || "")
        setStatus(task.status)
        setPriority(task.priority)
        setAssigneeId(task.assignee_id || "")
        setDueDate(task.due_date || "")
      } else {
        setTitle("")
        setDescription("")
        setStatus("todo")
        setPriority("medium")
        setAssigneeId("")
        setDueDate("")
      }
      setErrors({})
    }
  }, [open, task])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) {
      newErrors.title = "Title is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
    }

    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({ id: task.id, data, projectId })
        toast.success("Task updated successfully!")
      } else {
        await createTask.mutateAsync({ projectId, data })
        toast.success("Task created successfully!")
      }
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to save task")
    }
  }

  const handleDelete = async () => {
    if (!task) return

    try {
      await deleteTask.mutateAsync({ id: task.id, projectId })
      toast.success("Task deleted successfully!")
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task")
    }
  }

  const isPending = createTask.isPending || updateTask.isPending || deleteTask.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-120 sm:max-w-full">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg font-semibold">
              {isEditing ? "Edit Task" : "Create Task"}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {isEditing
                ? "Make changes to your task."
                : "Add a new task to this project."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 p-6">
            <div className="space-y-3">
              <Label htmlFor="title" className="mb-1 font-medium">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="mb-2"
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="mb-2 text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="mb-1 font-medium">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                className="mb-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-3">
                <Label className="mb-1 font-medium">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as any)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue className="flex h-full items-center">
                      {statusOptions.find((opt) => opt.value === status)
                        ?.label ?? status}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="h-50 overflow-y-auto">
                    {statusOptions.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="px-3 py-2 hover:bg-muted"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="mb-1 font-medium">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as any)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue className="flex h-full items-center">
                      {priorityOptions.find((opt) => opt.value === priority)
                        ?.label ?? priority}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="h-50 overflow-y-auto">
                    {priorityOptions.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="px-3 py-2 hover:bg-muted"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="mb-1 font-medium">Assignee</Label>
              <Select
                value={assigneeId}
                onValueChange={(v) => setAssigneeId(v || "")}
              >
                <SelectTrigger className="h-10">
                  <SelectValue className="flex h-full items-center placeholder:text-muted-foreground">
                    {assigneeId
                      ? (users?.find((user) => user.id === assigneeId)?.name ??
                        assigneeId)
                      : "Unassigned"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="h-50 overflow-y-auto">
                  <SelectItem value="" className="px-3 py-2 hover:bg-muted">
                    Unassigned
                  </SelectItem>
                  {users?.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.id}
                      className="px-3 py-2 hover:bg-muted"
                    >
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="due-date" className="mb-1 font-medium">
                Due Date
              </Label>
              <Popover open={dueDatePickerOpen} onOpenChange={setDueDatePickerOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      id="due-date"
                      className={cn(
                        "h-10 w-full justify-start px-2.5 font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    />
                  }
                >
                  <CalendarIcon data-icon="inline-start" />
                  {formatDateLabel(dueDate)}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseDateInput(dueDate)}
                    onSelect={(selectedDate) => {
                      if (!selectedDate) return

                      setDueDate(formatDateInput(selectedDate))
                      setDueDatePickerOpen(false)
                    }}
                    captionLayout="dropdown"
                  />
                  {dueDate && (
                    <div className="border-t p-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setDueDate("")
                          setDueDatePickerOpen(false)
                        }}
                      >
                        Clear date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <SheetFooter>
            {isEditing && canDeleteTask ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                {deleteTask.isPending ? "Deleting..." : "Delete Task"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Task"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
