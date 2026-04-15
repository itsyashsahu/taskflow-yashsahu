import { useState } from "react"
import { Link, useLocation } from "react-router"
import {
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  Plus,
  LogOut,
  Menu,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Logo } from "~/components/Logo"
import { useAuthStore, useLogout } from "~/store/auth"
import { cn } from "~/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet"

const navItems = [
  { path: "/app/projects", label: "Projects", icon: FolderKanban },
  { path: "/app/my-tasks", label: "My Tasks", icon: CheckSquare },
  { path: "/app/team", label: "Team", icon: Users },
  { path: "/app/settings", label: "Settings", icon: Settings },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const { user } = useAuthStore()
  const logout = useLogout()

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = () => {
    onNavigate?.()
    logout()
  }

  return (
    <>
      <div className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-sidebar px-4">
        <Logo className="h-8" />
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-2">
        <Link
          to="/app/projects?create=true"
          onClick={onNavigate}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
        >
          <Plus className="size-4" />
          New Project
        </Link>
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user ? getInitials(user.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-svh w-60 flex-col border-r border-border bg-sidebar text-sidebar-foreground lg:flex">
      <SidebarContent />
    </aside>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-4" />
      </Button>
      <SheetContent side="left" className="w-70 p-0 sm:w-80" showCloseButton>
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}