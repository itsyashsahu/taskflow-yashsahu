# TaskFlow Backend Changelog

## v1.0.3 - Env Example Relocation

### Changed
- Moved env example files from `backend/.env.example` and `frontend/.env.example` to `backend/env/.env.example` and `frontend/env/.env.example`
- Updated ignore rules so `env/.env.example` stays tracked while local env files remain ignored
- Updated setup docs to copy env examples from the new `env/` locations

## v1.0.2 - Transaction Middleware + Varlock

### Added
- Transaction middleware: wraps POST/PUT/DELETE routes in DB transactions
- Auto-rollback on errors
- GET routes bypass transaction for performance
- GetDb helper for transaction access
- Varlock + Bitwarden setup (.env.schema, env/.env.local)

## v1.0.2 - Transaction Middleware

### Added
- Transaction middleware: wraps POST/PUT/DELETE routes in DB transactions
- Auto-rollback on errors
- GET routes bypass transaction for performance

## v1.0.1 - Logging & Request ID

### Added
- Request ID middleware: reads x-request-id header or generates UUID
- Logger middleware: request-scoped logging with requestId
- Console.* methods redirected to pino logger
- .nvmrc (Node 22.19.0), .npmrc (pnpm 10.28.0, exact versions)
- TypeScript types for requestId/auth variables
- DB setup scripts

### Each Request Now Has
- Unique requestId (from header or UUID)
- requestId in every log line
- Duration and status in logs