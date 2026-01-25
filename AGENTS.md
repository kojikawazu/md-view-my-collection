# Repository Guidelines

## Project Structure & Module Organization
- `base/` contains the original Vite + React layout and is **read-only**.
  - `base/App.tsx`, `base/index.tsx` are the entry points.
  - `base/pages/` holds route-level screens (List, Detail, Form, Login).
  - `base/components/` contains shared UI pieces (Header, Sidebar, Footer, modals).
  - `base/constants.tsx` and `base/types.ts` define theme/data and TypeScript models.
  - `base/metadata.json` describes the app for deployment platforms.
- `front/` is the working copy of `base/` for all development changes.
- `docs/` stores planning and requirements notes.
- Root `README.md` is currently empty; `base/README.md` explains local setup.

## Build, Test, and Development Commands
Run commands from `front/` (not `base/`):
- `npm install` installs dependencies.
- `npm run dev` starts the Vite dev server.
- `npm run build` creates a production build in `front/dist/`.
- `npm run preview` serves the production build locally.

Configuration:
- Create `front/.env.local` only if required later; currently no env vars are needed.

## Coding Style & Naming Conventions
- TypeScript + React with functional components.
- 2-space indentation and semicolons are used in the existing code.
- Filenames: PascalCase for React components (e.g., `Header.tsx`), camelCase for utilities.
- Prefer colocating page-specific logic in `front/pages/` and reusable UI in `front/components/`.
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
- The UI stores sample data in `localStorage` (see `base/App.tsx`), so verify behavior with fresh storage when debugging.
- Deployment is Vercel, `main` branch only, `front/` directory only, no preview.
- Database migrations are禁止 (no migrations). Schema changes must be reflected only in code files and applied in the separate DB project by the owner.
- Always read `docs/TASKS.md` before starting work to align on remaining tasks and completion status.
- After each completed task, update `docs/TASKS.md` and this file if requirements or workflows changed.
