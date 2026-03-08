# NABI Homepage

A Payload CMS + Next.js site for NABI (Natural and Artificial Brain Intelligence), with a public frontend and integrated Payload admin.

## Stack

- Next.js App Router
- Payload CMS (Postgres adapter)
- TypeScript
- Tailwind CSS v4

## Local Development

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Install dependencies and start dev server:

```bash
pnpm install
pnpm dev
```

3. Open:

- Frontend: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

### Database Environment

- `STORAGE_DATABASE_URL` is the primary Postgres connection string used by Payload and BetterAuth.
- `STORAGE_DATABASE_USE_NEON_SERVERLESS` optionally forces Neon serverless pooling (`true` / `false`).
- `DATABASE_URL` is treated as a deprecated fallback during migration.
- `AUTH_DEBUG_LOGS=true` enables verbose auth-bridge diagnostics (default `false`).
- `AUTH_SESSION_CACHE_TTL_MS` controls short-lived BetterAuth session lookup caching (default `60000` ms).
- Production blocks shared test logins (`test@example.com`, `dev@payloadcms.com`) by default; extend with `AUTH_PRODUCTION_BLOCKED_EMAILS`.

## Core Commands

- `pnpm dev`: start development server
- `pnpm build`: production build
- `pnpm start`: run production server
- `pnpm lint`: run Next lint
- `pnpm lint:fix`: run lint with fixes
- `pnpm typecheck`: run TypeScript checks
- `pnpm test`: run integration + e2e test suites
- `pnpm test:int`: run integration tests (Vitest)
- `pnpm test:e2e`: run e2e tests (Playwright)
- `pnpm generate:types`: regenerate `src/payload-types.ts`
- `pnpm generate:importmap`: regenerate Payload admin import map
- `pnpm seed:test-accounts`: upsert fixed shared test accounts used by tests
- `pnpm payload migrate:create`: create DB migration
- `pnpm payload migrate`: run DB migrations

## Git Hooks

Pre-commit hooks are managed with Husky + lint-staged.

- Hook: `.husky/pre-commit`
- Behavior: runs ESLint + Prettier on staged files only

If hooks are not installed yet, run:

```bash
pnpm prepare
```

## CI/CD

GitHub Actions workflows:

- `CI` (`.github/workflows/ci.yml`)
  - Pull requests: runs fast quality checks (`pnpm lint` + `pnpm typecheck`)
  - `main` pushes / manual dispatch: additionally verifies generated files (`importMap.js`, `payload-types.ts`)
  - `main` pushes / manual dispatch: runs production build
  - Optional non-blocking Docker smoke build runs only when a `Dockerfile` exists
- `Security` (`.github/workflows/security.yml`)
  - Runs dependency review on pull requests
  - Runs `pnpm audit --audit-level=critical` on `main`, manual dispatch, and biweekly schedule
- `Dependabot` (`.github/dependabot.yml`)
  - Checks npm and GitHub Actions dependencies every 2 weeks and opens update PRs with security/dependency labels

## Content Model Overview

Main collections configured in `src/payload.config.ts`:

- `posts`
- `news`
- `research`
- `people`
- `tags`
- `categories`
- `media`
- `users`

Globals:

- `header`
- `footer`
- `homePage`
- `aboutPage`
- `contactPage`

## Frontend Routes

Primary public routes include:

- `/` (home)
- `/about`
- `/people`, `/people/[slug]`
- `/posts`, `/posts/[slug]`
- `/news`, `/news/[slug]`
- `/labs`, `/labs/[slug]`
- `/references`
- `/symposium`
- `/contact`

## Migrations and Deployment

For schema changes on shared/production databases:

1. Update Payload schema.
2. Create migration: `pnpm payload migrate:create`
3. Commit migration files.
4. Run migration in target environment: `pnpm payload migrate`

This repository keeps executable migrations under `src/migrations/` and references them via `src/migrations/index.ts`.

### Production Media Uploads

By default, local development uploads write to `public/media`.

For production (especially Vercel), configure S3-compatible storage via `.env`:

- `S3_STORAGE_ENABLED=true`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

Optional:

- `S3_ENDPOINT` (required for Cloudflare R2)
- `S3_PUBLIC_URL` (recommended for R2: custom domain or `*.r2.dev` for browser-accessible file URLs)
- `S3_MEDIA_PREFIX` (optional folder prefix for keys and public URLs, e.g. `webp`)
- `S3_FORCE_PATH_STYLE`
- `S3_CLIENT_UPLOADS=true` (recommended on Vercel for larger uploads)

When S3 env vars are configured, the `media` collection uses cloud storage and avoids ephemeral local disk.
Notebook uploads follow the same storage backend through the dedicated `notebooks` collection.
If `S3_MEDIA_PREFIX` is set, notebook objects are stored under `<prefix>/notebooks`.
Otherwise notebook objects are stored under `notebooks/`.

## Notebook Dependency (Labs)

`/labs/[slug]` renders uploaded `.ipynb` files through Datalayer's read-only notebook viewer.

Research entries now link notebooks through the `research.notebook` upload field, which points to the
dedicated `notebooks` collection. The uploaded notebook file is the source of truth; notebook files are
no longer read from the repository at request time.

Optional research fields:

- `colabURL`
- `kaggleURL`

These are rendered as external actions when present. A direct notebook download link is always derived from
the uploaded notebook file.

## Security and Local API Notes

When using Payload Local API with a user context, enforce access control explicitly:

- pass `overrideAccess: false` when authorizing as a specific user

In hooks, pass `req` to nested Payload operations to preserve transaction scope.

## Testing and Validation

For schema/UI changes, run:

```bash
pnpm generate:importmap
pnpm generate:types
pnpm -s tsc --noEmit
pnpm test:int
```

Run `pnpm test:e2e` when route-level or UX behavior changes.
