# Frontend (Next.js)

`front/` is the active Next.js App Router implementation for the Report Viewer UI.

## Setup
```
npm install
```

## Development
```
npm run dev
```

## Production build
```
npm run build
npm run start
```

## E2E (Playwright)
```
npx playwright install
npm run test:e2e
```

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (OAuth redirect, if needed)
- `NEXT_PUBLIC_ADMIN_EMAIL` / `ADMIN_EMAIL`
- `NEXT_PUBLIC_AUTH_MODE` / `NEXT_PUBLIC_DATA_MODE` (local mode for E2E)

## Docs
See `../docs/README.md` for requirements, UI layout, and E2E specs.
