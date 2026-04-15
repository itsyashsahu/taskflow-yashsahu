import { Link } from "react-router"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent } from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"
import { useUsers } from "~/api/hooks"
import { PageHeader, PageState } from "~/components/common"

export default function Team() {
  const { data: users, isLoading, isError, error } = useUsers()

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6">
        <PageState
          variant="destructive"
          title="Error loading team"
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

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Team"
        description="View team members and their task distribution."
      />

      {users && users.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <Link key={user.id} to={user.id ? `/app/team/${user.id}` : "/app/team"}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4 sm:p-5">
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

                  <div className="mt-4 flex flex-wrap gap-2">
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
        <PageState
          title="No team members yet"
          description="Team members will appear here once they join."
        />
      )}
    </div>
  )
}