# Agent Guidelines

## Documentation References
- **Backend Spec:** `backend.md`
- **Frontend Spec:** `frontend.md`
- **Changelog:** `CHANGELOG.md`

## Commit Rules

### Always Update Changelog
Before committing, add a short entry to CHANGELOG.md under the current version:

```markdown
## v1.0.1 - Description

### Added/Fixed/Changed
- Brief description of change
```

### Version Format
- v1.0.0 - Initial
- v1.0.1 - Logging, Request ID
- Increment patch for fixes, minor for features

## Before Commit
1. Update CHANGELOG.md
2. Verify no secrets (.env not staged)
3. Check TypeScript compiles