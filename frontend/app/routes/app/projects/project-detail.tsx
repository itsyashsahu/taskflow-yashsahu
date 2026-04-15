import { useState, useEffect } from "react"
import { useParams, Link } from "react-router"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  LayoutGrid,
  List,
  Plus,
  Pencil,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Skeleton } from "~/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { TaskRow, TaskCard, TaskDrawer } from "~/components/tasks"
import { StatusIcon } from "~/components/tasks"
import { EditProjectModal } from "~/components/projects"
import { useProject, useUpdateTask } from "~/api/hooks"
import { useAuth } from "~/store/auth"
import { toast } from "sonner"
import type { Task } from "~/api/projects"
import { PageState } from "~/components/common"

type ViewMode = "list" | "board"

const STORAGE_KEY = "taskflow-view-preferences"

function getViewPreference(projectId: string): ViewMode {
  try {
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    return prefs[projectId] || "list"
  } catch {
    return "list"
  }
}

function setViewPreference(projectId: string, mode: ViewMode) {
  try {
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    prefs[projectId] = mode
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore storage errors
  }
}

interface SortableTaskCardProps {
  task: Task
  onClick: () => void
}

function SortableTaskCard({ task, onClick }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      className={isDragging ? "opacity-50" : "opacity-100"}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  )
}

interface BoardColumnProps {
  title: string
  status: Task["status"]
  tasks: Task[]
  projectId: string
  onTaskClick: (task: Task) => void
  onAddTask: (status: Task["status"]) => void
}

function BoardColumn({
  title,
  status,
  tasks,
  projectId,
  onTaskClick,
  onAddTask,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  const columnColors: Record<string, string> = {
    todo: "bg-muted",
    in_progress: "bg-indigo-50 dark:bg-indigo-950/20",
    done: "bg-emerald-50 dark:bg-emerald-950/20",
  }

  return (
    <div className="flex flex-col rounded-lg bg-muted/30">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-3 py-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{title}</h3>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => onAddTask(status)}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-50 space-y-2 overflow-y-auto rounded-b-lg p-2 transition-colors ${
          isOver ? "bg-primary/5" : ""
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border">
            <p className="text-sm text-muted-foreground">No tasks</p>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => onAddTask(status)}
        >
          <Plus className="mr-2 size-4" />
          Add task
        </Button>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false)
  const [taskDrawerStatus, setTaskDrawerStatus] = useState<Task["status"]>("todo")
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(["done"]))
  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const { data: project, isLoading, isError, error } = useProject(id || "")
  const { user } = useAuth()
  const updateTask = useUpdateTask()

  useEffect(() => {
    if (id) {
      setViewMode(getViewPreference(id))
    }
  }, [id])

  useEffect(() => {
    if (id && viewMode) {
      setViewPreference(id, viewMode)
    }
  }, [viewMode, id])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = project?.tasks.find((t) => t.id === event.active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)

    if (!event.over || !project) return

    const taskId = event.active.id as string
    const overId = String(event.over.id)
    const validStatuses: Task["status"][] = ["todo", "in_progress", "done"]

    let newStatus: Task["status"] | null = null
    if (validStatuses.includes(overId as Task["status"])) {
      newStatus = overId as Task["status"]
    } else {
      const overTask = project.tasks.find((t) => t.id === overId)
      if (overTask) {
        newStatus = overTask.status
      }
    }

    const task = project.tasks.find((t) => t.id === taskId)
    if (!task || !newStatus || task.status === newStatus) return

    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: { status: newStatus },
        projectId: id || "",
      })
      toast.success(`Task moved to ${newStatus.replace("_", " ")}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to move task")
    }
  }

  const toggleGroup = (group: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(group)) {
      newCollapsed.delete(group)
    } else {
      newCollapsed.add(group)
    }
    setCollapsedGroups(newCollapsed)
  }

  const handleAddTask = (status: Task["status"]) => {
    setEditingTask(null)
    setTaskDrawerStatus(status)
    setTaskDrawerOpen(true)
  }

  if (!id) {
    return (
      <div className="p-4 sm:p-6">
        <PageState
          variant="destructive"
          title="Invalid project ID"
          description="The requested project could not be loaded."
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="mb-8 h-4 w-96" />
        <div className="space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="p-4 sm:p-6">
        <PageState
          variant="destructive"
          title="Error loading project"
          description={error?.message || "Please try again later"}
        />
      </div>
    )
  }

  const filteredTasks = project.tasks.filter((task) => {
    if (viewMode === "list" && statusFilter !== "all" && task.status !== statusFilter) {
      return false
    }
    if (assigneeFilter !== "all" && task.assignee_id !== assigneeFilter) return false
    return true
  })

  const todoTasks = filteredTasks.filter((t) => t.status === "todo")
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in_progress")
  const doneTasks = filteredTasks.filter((t) => t.status === "done")

  const uniqueAssignees = Array.from(
    new Map(
      project.tasks
        .filter((t) => t.assignee_id && t.assignee_name)
        .map((t) => [t.assignee_id, { id: t.assignee_id, name: t.assignee_name! }])
    ).values()
  )
  const isProjectOwner = project.owner_id === user?.id

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant="secondary">Active</Badge>
              {isProjectOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setEditProjectOpen(true)}
                >
                  <Pencil className="size-4" />
                </Button>
              )}
            </div>
            {project.description && (
              <p className="mt-1 text-muted-foreground">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode("list")}
              >
                <List className="size-4" />
              </Button>
              <Button
                variant={viewMode === "board" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode("board")}
              >
                <LayoutGrid className="size-4" />
              </Button>
            </div>
            <Button onClick={() => handleAddTask("todo")}>
              <Plus className="mr-2 size-4" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        {viewMode === "list" && (
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
        )}

        <Select value={assigneeFilter} onValueChange={(v) => setAssigneeFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue placeholder="All Assignees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {uniqueAssignees.map((assignee) => (
              <SelectItem key={assignee.id} value={assignee.id}>
                {assignee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-4">
          {todoTasks.length > 0 && (
            <div className="rounded-lg border border-border">
              <button
                className="flex w-full items-center gap-2 p-3 text-left font-medium hover:bg-muted/50"
                onClick={() => toggleGroup("todo")}
              >
                {collapsedGroups.has("todo") ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
                <span className="capitalize">Todo</span>
                <Badge variant="secondary">{todoTasks.length}</Badge>
              </button>
              {!collapsedGroups.has("todo") && (
                <div>
                  {todoTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      projectId={id}
                      onEdit={setEditingTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {inProgressTasks.length > 0 && (
            <div className="rounded-lg border border-border">
              <button
                className="flex w-full items-center gap-2 p-3 text-left font-medium hover:bg-muted/50"
                onClick={() => toggleGroup("in_progress")}
              >
                {collapsedGroups.has("in_progress") ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
                <span className="capitalize">In Progress</span>
                <Badge variant="secondary">{inProgressTasks.length}</Badge>
              </button>
              {!collapsedGroups.has("in_progress") && (
                <div>
                  {inProgressTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      projectId={id}
                      onEdit={setEditingTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {doneTasks.length > 0 && (
            <div className="rounded-lg border border-border">
              <button
                className="flex w-full items-center gap-2 p-3 text-left font-medium hover:bg-muted/50"
                onClick={() => toggleGroup("done")}
              >
                {collapsedGroups.has("done") ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
                <span className="capitalize">Done</span>
                <Badge variant="secondary">{doneTasks.length}</Badge>
              </button>
              {!collapsedGroups.has("done") && (
                <div>
                  {doneTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      projectId={id}
                      onEdit={setEditingTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {filteredTasks.length === 0 && (
            <PageState
              title="No tasks yet"
              description="Create the first task to get started."
              icon={
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              }
              action={
                <Button onClick={() => handleAddTask("todo")}>
                  <Plus className="mr-2 size-4" />
                  Create the first task
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-3 gap-4">
            <BoardColumn
              title="Todo"
              status="todo"
              tasks={todoTasks}
              projectId={id}
              onTaskClick={(task) => {
                setEditingTask(task)
                setTaskDrawerOpen(true)
              }}
              onAddTask={handleAddTask}
            />
            <BoardColumn
              title="In Progress"
              status="in_progress"
              tasks={inProgressTasks}
              projectId={id}
              onTaskClick={(task) => {
                setEditingTask(task)
                setTaskDrawerOpen(true)
              }}
              onAddTask={handleAddTask}
            />
            <BoardColumn
              title="Done"
              status="done"
              tasks={doneTasks}
              projectId={id}
              onTaskClick={(task) => {
                setEditingTask(task)
                setTaskDrawerOpen(true)
              }}
              onAddTask={handleAddTask}
            />
          </div>

          <DragOverlay>
            {activeTask && (
              <TaskCard task={activeTask} onClick={() => {}} isDragging />
            )}
          </DragOverlay>
        </DndContext>
      )}

      <TaskDrawer
        projectId={id}
        task={editingTask}
        currentUserId={user?.id}
        projectOwnerId={project.owner_id}
        open={taskDrawerOpen}
        onOpenChange={(open) => {
          setTaskDrawerOpen(open)
          if (!open) {
            setEditingTask(null)
          }
        }}
      />

      {isProjectOwner && (
        <EditProjectModal
          project={project}
          open={editProjectOpen}
          onOpenChange={setEditProjectOpen}
        />
      )}
    </div>
  )
}