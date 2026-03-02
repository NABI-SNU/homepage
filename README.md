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

## Core Commands

- `pnpm dev`: start development server
- `pnpm build`: production build
- `pnpm start`: run production server
- `pnpm lint`: run Next lint
- `pnpm lint:fix`: run lint with fixes
- `pnpm test`: run integration + e2e test suites
- `pnpm test:int`: run integration tests (Vitest)
- `pnpm test:e2e`: run e2e tests (Playwright)
- `pnpm generate:types`: regenerate `src/payload-types.ts`
- `pnpm generate:importmap`: regenerate Payload admin import map
- `pnpm payload migrate:create`: create DB migration
- `pnpm payload migrate`: run DB migrations

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

## Notebook Dependency (Labs)

`/labs/[slug]` supports notebook previews by reading notebook JSON from paths stored in `research.notebookPath`.

Current local notebook content is expected under:

- `content/notebooks/`

If notebook files are moved or removed, the lab detail page shows a "not found" notebook message.

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
