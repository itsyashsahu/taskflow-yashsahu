import { Link } from "react-router"
import { buttonVariants } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-8xl font-bold text-muted-foreground">404</CardTitle>
          <CardDescription className="text-lg font-medium">Page not found</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/app" className={buttonVariants({ variant: "default" })}>
              Go Home
            </Link>
            <Link to="/login" className={buttonVariants({ variant: "outline" })}>
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}