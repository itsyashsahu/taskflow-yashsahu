# Agent Guidelines

## Documentation References
- **Backend Spec:** `backend.md` - Full backend implementation details
- **Frontend Spec:** `frontend.md` - Full frontend implementation details
- **Changelog:** `CHANGELOG.md` - Version history and changes

## Core Rules

### Always Update Changelog
When committing changes, ALWAYS update CHANGELOG.md first with a short entry describing:
- New features added
- Changes to existing functionality
- Bug fixes
- Breaking changes

Format:
```markdown
### Added/Fixed/Changed
- Brief description of change
```

### Versioning
- Start with v1.0.0
- Increment patch for fixes, minor for features, major for breaking

## Before Committing
1. Update CHANGELOG.md with changes
2. Ensure no secrets in staged files (check .env)
3. Run tests if available
4. Verify TypeScript compiles

## Important Notes
- .env contains database credentials - NEVER commit
- Use exact versions in package.json (no ^)
- Node 22.19.0, pnpm 10.28.0