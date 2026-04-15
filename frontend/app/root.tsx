import { Link } from "react-router"
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router"

import type { Route } from "./+types/root"
import { QueryProvider } from "~/lib/query-provider"
import { Toaster } from "~/components/ui/sonner"
import { ThemeProvider } from "~/components/theme-provider"
import { Button, buttonVariants } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import "./app.css"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Prevent theme flash on initial load - runs during HTML parsing */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('taskflow-theme') || 'system';
                const root = document.documentElement;
                
                if (theme === 'dark') {
                  root.classList.add('dark');
                } else if (theme === 'light') {
                  root.classList.remove('dark');
                } else {
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    root.classList.add('dark');
                  } else {
                    root.classList.remove('dark');
                  }
                }
              })();
            `,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider defaultTheme="system" storageKey="taskflow-theme">
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Oops!"
  let description = "An unexpected error occurred."
  let status = 0
  let devError: Error | null = null

  if (isRouteErrorResponse(error)) {
    status = error.status
    title = error.status === 404 ? "404" : "Error"
    description = error.status === 404
      ? "The requested page could not be found."
      : error.statusText || description
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    description = error.message
    devError = error
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-8xl font-bold text-destructive">
            {status || "Error"}
          </CardTitle>
          <CardDescription className="text-lg font-medium">{title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{description}</p>
          <div className="flex justify-center gap-4">
            <Link to="/" className={buttonVariants({ variant: "default" })}>
              Go Home
            </Link>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
          {devError && (
            <pre className="mt-4 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
              <code>{devError.stack}</code>
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}