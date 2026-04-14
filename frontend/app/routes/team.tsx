import { Link } from "react-router"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent } from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"
import { useUsers } from "~/api/hooks"

export default function Team() {
  const { data: users, isLoading, isError, error } = useUsers()

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Error loading team</p>
          <p className="text-sm">{error?.message || "Please try again later"}</p>
        </div>
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-muted-foreground">
          View team members and their task distribution
        </p>
      </div>

      {users && users.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Link key={user.id} to={`/team/${user.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{user.name}</h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <span className="size-1.5 rounded-full bg-muted-foreground" />
                      {user.todo_count} Todo
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {user.in_progress_count} In Progress
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      {user.done_count} Done
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16">
          <h3 className="mb-1 text-lg font-semibold">No team members yet</h3>
          <p className="text-sm text-muted-foreground">
            Team members will appear here once they join
          </p>
        </div>
      )}
    </div>
  )
}