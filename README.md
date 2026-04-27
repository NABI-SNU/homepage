# NABI Homepage

```text
+-------------------+      +-------------------+      +-------------------+
| 1. Clone + install| ---> | 2. Copy .env file | ---> | 3. Run pnpm dev   |
+-------------------+      +-------------------+      +-------------------+
          |                            |                           |
          v                            v                           v
   Node 24 + pnpm 10             Local Postgres             Frontend + Admin
```

NABI Homepage is a Next.js App Router app with an integrated Payload CMS admin for easy manipulation of the backend data.

## Start Here

### Requirements

- Node `24.x`
- pnpm `10.x`
- Postgres

The repo pins the expected versions in `.nvmrc` and `package.json`.

### Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy the environment file:

```bash
cp .env.example .env
```

3. Fill in the required local values:

- `STORAGE_DATABASE_URL`
- `PAYLOAD_SECRET`
- `BETTER_AUTH_SECRET`
- `NEXT_PUBLIC_SERVER_URL`
- `BETTER_AUTH_URL`
- `PREVIEW_SECRET`
- `CRON_SECRET`

4. Start the app:

```bash
pnpm dev
```

5. Open the app:

- Frontend: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## Core Commands

- `pnpm dev`: start local development
- `pnpm build`: create a production build
- `pnpm start`: run the production build
- `pnpm lint`: run ESLint
- `pnpm typecheck`: run TypeScript checks
- `pnpm test:int`: run Vitest integration tests
- `pnpm test:e2e`: run Playwright end-to-end tests
- `pnpm generate:types`: regenerate `src/payload-types.ts`
- `pnpm generate:importmap`: regenerate `src/app/(payload)/admin/importMap.js`
- `pnpm migrate`: run checked-in Payload migrations
- `pnpm seed:test-accounts`: upsert the shared test accounts

## Shared Test Accounts

Use the seeded shared accounts for local testing and automated tests.

- Member account: `test@example.com` / `test`
- Admin account: `dev@payloadcms.com` / `test`

Do not create or delete users inside tests.

## Validation Before a PR

```text
Small UI/content change     -> pnpm lint && pnpm typecheck
Schema or admin UI change   -> generate:* + typecheck + test:int
Route or UX change          -> lint + typecheck + relevant e2e test
```

Recommended full validation for schema or Payload admin changes:

```bash
pnpm generate:importmap
pnpm generate:types
pnpm typecheck
pnpm test:int
```

Run `pnpm test:e2e` when you change route behavior, interactive UX, or auth/admin journeys.

## Where Next

Start with the onboarding docs:

- [Contributor entry point](docs/onboarding/README.md)
- [Architecture guide](docs/onboarding/architecture.md)
- [Common workflows](docs/onboarding/common-workflows.md)
- [Payload safety rules](docs/onboarding/payload-safety.md)
- [Reviewer guide](docs/onboarding/reviewer-guide.md)

Contributor workflow details live in [CONTRIBUTING.md](CONTRIBUTING.md).
