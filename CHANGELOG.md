# TaskFlow Backend Changelog

## v1.0.1 - Logging, Request ID & Health

### Added
- Request ID middleware: reads x-request-id header or generates UUID
- Logger middleware: request-scoped logging with requestId in every log
- Console.* methods redirected to pino logger
- .nvmrc (Node 22.19.0), .npmrc (pnpm 10.28.0, exact versions)
- TypeScript types for requestId/auth variables
- DB setup scripts
- GET /health endpoint returns { status: "ok" }
- Removed pid/hostname from logs, ISO timestamp

### Each Request Now Has
- Unique requestId (from header or UUID)
- requestId in every log line
- Duration and status in logs