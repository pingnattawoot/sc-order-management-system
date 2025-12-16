# ADR-010: Deployment Strategy

## Status

**Accepted**

## Date

2025-12-16

## Context

The Order Management System needs a deployment strategy that:

1. **Demonstrates CI/CD** for interview purposes
2. **Uses free tiers** to minimize costs
3. **Supports the tech stack**: Node.js API, React SPA, PostgreSQL
4. **Shows production-ready practices** (health checks, environment config, etc.)

### Requirements

| Component | Technology      | Deployment Needs            |
| --------- | --------------- | --------------------------- |
| Frontend  | Vite React      | Static hosting, CDN         |
| Backend   | Fastify GraphQL | Node.js runtime, persistent |
| Database  | PostgreSQL      | Managed, persistent storage |

### Platforms Considered

| Platform    | Frontend     | Backend            | Database       | Free Tier             |
| ----------- | ------------ | ------------------ | -------------- | --------------------- |
| **Vercel**  | ✅ Excellent | ⚠️ Serverless only | ❌ No          | Generous              |
| **Railway** | ✅ Good      | ✅ Good            | ✅ Good        | $5/month credit       |
| **Render**  | ✅ Good      | ✅ Good            | ✅ 90-day free | Spin-down on idle     |
| **Fly.io**  | ⚠️ Complex   | ✅ Good            | ✅ Good        | 3 VMs free            |
| **Neon**    | ❌ No        | ❌ No              | ✅ Excellent   | Serverless PostgreSQL |

## Decision

We will use a **multi-platform deployment strategy**:

| Component    | Platform           | Reason                                                  |
| ------------ | ------------------ | ------------------------------------------------------- |
| **Frontend** | Vercel             | Best-in-class for React/Vite, automatic preview deploys |
| **Backend**  | Railway            | Simple Node.js hosting, good free tier                  |
| **Database** | Railway PostgreSQL | Co-located with API, included in free tier              |
| **CI/CD**    | GitHub Actions     | Free for public repos, excellent ecosystem              |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    GitHub Actions CI/CD                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │    │
│  │  │    Lint     │  │    Test     │  │   Type Check        │  │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │    │
│  │         └────────────────┼────────────────────┘             │    │
│  │                          ▼                                  │    │
│  │              ┌───────────────────────┐                      │    │
│  │              │    Deploy (on main)   │                      │    │
│  │              └───────────┬───────────┘                      │    │
│  └──────────────────────────┼──────────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                                     ▼
┌─────────────────────────┐        ┌─────────────────────────┐
│        Vercel           │        │        Railway          │
│  ┌───────────────────┐  │        │  ┌───────────────────┐  │
│  │   React Frontend  │  │        │  │   Fastify API     │  │
│  │   (apps/web)      │  │        │  │   (apps/api)      │  │
│  │                   │  │        │  └─────────┬─────────┘  │
│  │   • Static files  │  │        │            │            │
│  │   • CDN edge      │  │        │            ▼            │
│  │   • Preview URLs  │  │        │  ┌───────────────────┐  │
│  └───────────────────┘  │        │  │   PostgreSQL      │  │
│                         │        │  │   (managed)       │  │
│  URL: *.vercel.app      │        │  └───────────────────┘  │
└─────────────────────────┘        │                         │
           │                       │  URL: *.railway.app     │
           │                       └─────────────────────────┘
           │                                    │
           └────────────────┬───────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   End Users     │
                   └─────────────────┘
```

## Rationale

### Why Vercel for Frontend?

1. **Optimized for Vite/React** - Zero-config deployment
2. **Preview deployments** - Every PR gets a unique URL
3. **Edge CDN** - Fast globally
4. **Generous free tier** - 100GB bandwidth, unlimited sites
5. **GitHub integration** - Auto-deploy on push

### Why Railway for Backend?

1. **Persistent processes** - Unlike serverless, our Fastify server stays warm
2. **PostgreSQL included** - Single platform for API + DB
3. **Simple deployment** - Nixpacks auto-detects Node.js
4. **Environment variables** - Easy secrets management
5. **Good free tier** - $5/month credit covers light usage

### Why GitHub Actions?

1. **Free for public repos** - Unlimited minutes
2. **Excellent ecosystem** - Pre-built actions for everything
3. **YAML-based** - Infrastructure as code
4. **Matrix builds** - Test multiple Node versions
5. **Secrets management** - Secure deploy tokens

## Implementation

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"

jobs:
  # ============================================
  # Quality Checks (runs on all PRs and pushes)
  # ============================================
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm run lint

      - name: Type check
        run: pnpm run typecheck

  # ============================================
  # Tests (runs on all PRs and pushes)
  # ============================================
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: oms_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm --filter api exec prisma generate

      - name: Run migrations
        run: pnpm --filter api exec prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/oms_test

      - name: Run tests
        run: pnpm run test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/oms_test
          NODE_ENV: test

  # ============================================
  # Deploy API to Railway (only on main)
  # ============================================
  deploy-api:
    name: Deploy API
    needs: [quality, test]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway
        run: railway up --service api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  # ============================================
  # Deploy Frontend to Vercel (only on main)
  # ============================================
  deploy-web:
    name: Deploy Frontend
    needs: [quality, test]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build frontend
        run: pnpm --filter web build
        env:
          VITE_API_URL: ${{ secrets.PRODUCTION_API_URL }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/web
          vercel-args: "--prod"
```

### Railway Configuration

```toml
# apps/api/railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "pnpm run start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[[services]]
name = "api"
```

### Vercel Configuration

```json
// apps/web/vercel.json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Environment Variables

#### Railway (Backend)

| Variable       | Description                         |
| -------------- | ----------------------------------- |
| `DATABASE_URL` | Auto-provided by Railway PostgreSQL |
| `NODE_ENV`     | `production`                        |
| `PORT`         | Auto-provided by Railway            |
| `CORS_ORIGIN`  | Vercel frontend URL                 |

#### Vercel (Frontend)

| Variable       | Description     |
| -------------- | --------------- |
| `VITE_API_URL` | Railway API URL |

### Deployment Scripts

```json
// package.json (root)
{
  "scripts": {
    "deploy:api": "railway up --service api",
    "deploy:web": "vercel --prod",
    "deploy": "pnpm deploy:api && pnpm deploy:web"
  }
}
```

## Consequences

### Positive

- ✅ **Free deployment** - Both platforms have generous free tiers
- ✅ **Professional CI/CD** - Demonstrates production practices
- ✅ **Preview deployments** - PRs get unique URLs for review
- ✅ **Auto-scaling** - Vercel CDN handles traffic spikes
- ✅ **Easy rollback** - Both platforms support instant rollback
- ✅ **Infrastructure as code** - All config in repository

### Negative

- ⚠️ **Multiple platforms** - Two dashboards to manage
- ⚠️ **Cold starts** - Railway free tier may spin down
- ⚠️ **Credit limits** - Railway's $5/month may be exceeded with heavy use
- ⚠️ **Region separation** - API and frontend in different regions

### Mitigations

- Document deployment URLs clearly
- Add health checks to detect cold start issues
- Monitor Railway usage dashboard
- Consider upgrading to paid tier for production

## Alternative: All-in-One Railway

If managing two platforms is too complex:

```yaml
# Deploy both frontend and API on Railway
services:
  - name: api
    root: apps/api

  - name: web
    root: apps/web
    buildCommand: pnpm run build
    startCommand: npx serve dist -s
```

**Trade-off:** Less optimal for frontend (no CDN edge) but simpler management.

## Security Considerations

1. **Secrets** - Never commit tokens; use GitHub Secrets
2. **CORS** - Configure strict origin in production
3. **Database** - Railway provides secure private networking
4. **HTTPS** - Both platforms provide automatic SSL

## Cost Analysis

| Platform       | Free Tier          | Estimated Monthly  |
| -------------- | ------------------ | ------------------ |
| Vercel         | 100GB bandwidth    | $0                 |
| Railway        | $5 credit          | $0 (within credit) |
| GitHub Actions | Unlimited (public) | $0                 |
| **Total**      |                    | **$0**             |

## URLs After Deployment

| Component | URL Pattern                              |
| --------- | ---------------------------------------- |
| Frontend  | `https://sc-oms.vercel.app`              |
| API       | `https://sc-oms-api.railway.app`         |
| GraphiQL  | `https://sc-oms-api.railway.app/graphql` |
| Health    | `https://sc-oms-api.railway.app/health`  |

## References

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nixpacks (Railway's builder)](https://nixpacks.com/)
