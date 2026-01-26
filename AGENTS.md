# Repository Guidelines

## Project Structure & Module Organization
- `base/` contains the original (legacy) Vite + React layout and is **read-only**.
  - This is a historical reference snapshot only.
- `front/` is the working copy for all development changes (Next.js App Router).
  - Entry points: `front/src/app/layout.tsx`, `front/src/app/page.tsx`
  - Route-level screens live under `front/src/app/` (`/`, `/login`, `/report/*`).
  - Shared UI lives in `front/src/components/`.
  - Theme/data live in `front/src/constants.tsx` and `front/src/types.ts`.
- `docs/` stores planning and requirements notes.
- Root `README.md` describes this repo; `base/README.md` is legacy and not used.

## Build, Test, and Development Commands
Run commands from `front/` (not `base/`):
- `npm install` installs dependencies.
- `npm run dev` starts the Next.js dev server.
- `npm run build` creates a production build in `front/.next/`.
- `npm run start` serves the production build locally.

Configuration:
- Create `front/.env.local` as needed (e.g. Supabase keys, admin email, `NEXT_PUBLIC_SITE_URL`).

## Coding Style & Naming Conventions
- TypeScript + Next.js (App Router) + React with functional components.
- 2-space indentation and semicolons are used in the existing code.
- Filenames: PascalCase for React components (e.g., `Header.tsx`), camelCase for utilities.
- Prefer colocating route logic in `front/src/app/` and reusable UI in `front/src/components/`.
- Component splitting is encouraged where reuse makes sense.

## Testing Guidelines
- E2E-only strategy (no unit tests). Tooling target: Playwright.
- Test specification is in `docs/04.e2e-cases.md` (normal/edge/error cases are all required).

## Commit & Pull Request Guidelines
- This snapshot does not include Git history, so no established commit message convention is visible.
- Use short, imperative commit messages (e.g., "Add report filter state").
- PRs should include: a clear summary, testing notes (or "Not tested"), and screenshots for UI changes.
- Start development work on a separate branch (do not work directly on `main`).

## Agent-Specific Notes
- The UI stores local-mode data in `localStorage` (see `front/src/components/AppStateProvider.tsx`), so verify behavior with fresh storage when debugging.
- Deployment is Vercel, `main` branch only, `front/` directory only, no preview.
- Database migrations are禁止 (no migrations). Schema changes must be reflected only in code files and applied in the separate DB project by the owner.
- Always read `docs/TASKS.md` before starting work to align on remaining tasks and completion status.
- After each completed task, update `docs/TASKS.md` and this file if requirements or workflows changed.
