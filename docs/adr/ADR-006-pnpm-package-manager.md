# ADR-006: pnpm Package Manager

## Status
**Accepted**

## Date
2025-12-15

## Context

We need to choose a package manager for the monorepo. The options are:
- **npm** - Default Node.js package manager
- **yarn** - Facebook's alternative (v1 classic or v3+ berry)
- **pnpm** - Performant npm alternative

The project uses a monorepo structure with multiple workspaces:
- `apps/api` - Backend GraphQL API
- `apps/web` - React Frontend
- `packages/shared` - Shared utilities (future)

## Decision

We will use **pnpm** as our package manager.

## Rationale

### 1. Disk Space Efficiency

pnpm uses a content-addressable store and hard links:

```
# npm/yarn: Each project has its own node_modules
project-a/node_modules/lodash/  (4.5MB)
project-b/node_modules/lodash/  (4.5MB)  # Duplicate!
project-c/node_modules/lodash/  (4.5MB)  # Duplicate!

# pnpm: Single store, hard links
~/.pnpm-store/lodash@4.17.21/   (4.5MB)  # Only one copy
project-a/node_modules/.pnpm/lodash -> hard link
project-b/node_modules/.pnpm/lodash -> hard link
project-c/node_modules/.pnpm/lodash -> hard link
```

In a monorepo, this saves significant disk space.

### 2. Faster Installation

pnpm is consistently faster than npm and yarn:
- Parallel package downloads
- Efficient caching
- No duplicate installations

Typical speedup: **2-3x faster** than npm for clean installs.

### 3. Strict Node Modules

pnpm creates a strict `node_modules` structure:
- Packages can only access dependencies they explicitly declare
- Prevents "phantom dependencies" (using undeclared transitive deps)
- Catches missing dependencies before production

```javascript
// With npm: This might work accidentally
import something from 'transitive-dep'; // Not in package.json!

// With pnpm: This fails immediately
// Error: Cannot find module 'transitive-dep'
```

### 4. Excellent Monorepo Support

Native workspace support with `pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Commands:
```bash
# Run in specific workspace
pnpm --filter api dev

# Run in all workspaces
pnpm -r build

# Add dependency to specific workspace
pnpm --filter api add fastify
```

### 5. Lockfile Reliability

`pnpm-lock.yaml` is more deterministic:
- Cleaner merge conflicts
- Better reproducibility across environments

## Implementation

### Workspace Configuration

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "pnpm --filter api dev & pnpm --filter web dev",
    "dev:api": "pnpm --filter api dev",
    "dev:web": "pnpm --filter web dev",
    "build": "pnpm -r build",
    "test": "pnpm --filter api test",
    "lint": "pnpm -r lint"
  }
}
```

### Common Commands

| Task | Command |
|------|---------|
| Install all dependencies | `pnpm install` |
| Add dep to workspace | `pnpm --filter api add fastify` |
| Add dev dep to workspace | `pnpm --filter api add -D typescript` |
| Run script in workspace | `pnpm --filter api dev` |
| Run script in all workspaces | `pnpm -r build` |
| Run parallel in workspaces | `pnpm -r --parallel dev` |

## Consequences

### Positive
- Faster CI/CD pipelines
- Less disk usage on developer machines
- Stricter dependency resolution catches bugs early
- Better monorepo tooling

### Negative
- Team members need pnpm installed (`npm install -g pnpm`)
- Some tools assume npm (rare nowadays)
- Different commands from npm (minor learning curve)

### Mitigations
- Add `packageManager` field to enforce pnpm version
- Document pnpm installation in README
- Use `corepack enable` for automatic pnpm management

## Version Management

Use Node.js Corepack to manage pnpm version:

```json
{
  "packageManager": "pnpm@10.25.0"
}
```

```bash
# Enable corepack (comes with Node.js 22.12.0 LTS)
corepack enable

# pnpm is now available at the specified version
pnpm install
```

## Alternatives Considered

### npm
- ✅ No additional installation needed
- ❌ Slower installations
- ❌ Duplicate packages in node_modules
- ❌ Phantom dependencies possible

### yarn (v1 Classic)
- ✅ Mature and widely used
- ❌ Similar disk usage issues as npm
- ❌ Less active development

### yarn (v3+ Berry)
- ✅ Plug'n'Play for even faster installs
- ❌ PnP has compatibility issues with some tools
- ❌ More complex configuration

### Bun
- ✅ Extremely fast
- ❌ Less mature ecosystem
- ❌ Some compatibility issues with Node.js packages

## References
- [pnpm Documentation](https://pnpm.io/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [pnpm vs npm vs yarn Benchmark](https://pnpm.io/benchmarks)
- [Corepack Documentation](https://nodejs.org/api/corepack.html)

