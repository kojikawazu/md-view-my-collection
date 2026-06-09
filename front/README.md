# Frontend (Next.js)

`front/` is the active Next.js App Router implementation for the Report Viewer UI.
Use **pnpm** (npm / yarn are not used in this project).

## Setup
```
pnpm install
```

## Development
```
pnpm dev
```

To run without Supabase (local/E2E data mode):
```
NEXT_PUBLIC_AUTH_MODE=local NEXT_PUBLIC_DATA_MODE=local pnpm dev
```

## Production build
```
pnpm build
pnpm start
```

## E2E (Playwright)
```
pnpm exec playwright install
pnpm test:e2e
```

## Unit tests (Vitest)
```
pnpm test
```

## Environment variables
Copy `.env.local.example` to `.env.local` and fill in real values.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (OAuth redirect)
- `ADMIN_EMAIL` (server-only; comma-separated admin allowlist)
- `DATABASE_URL` (server-only; Prisma / Supabase Postgres connection)
- `NEXT_PUBLIC_AUTH_MODE` / `NEXT_PUBLIC_DATA_MODE` (local mode for E2E)

## Docs
See `../README.md` for setup and `../docs/README.md` for requirements, UI, data, API, and E2E specs.
