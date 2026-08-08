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

Run commands from `front/` (not `base/`). Use **pnpm** (npm / yarn are not used):

- `pnpm install` installs dependencies.
- `pnpm dev` starts the Next.js dev server.
- `pnpm build` creates a production build in `front/.next/`.
- `pnpm start` serves the production build locally.

Configuration:

- Create `front/.env.local` as needed (e.g. Supabase keys, admin email, `NEXT_PUBLIC_SITE_URL`).

## Coding Style & Naming Conventions

- TypeScript + Next.js (App Router) + React with functional components.
- 2-space indentation and semicolons are used in the existing code.
- Filenames: PascalCase for React components (e.g., `Header.tsx`), camelCase for utilities.
- Prefer colocating route logic in `front/src/app/` and reusable UI in `front/src/components/`.
- Component splitting is encouraged where reuse makes sense.

## Testing Guidelines

- Unit tests with Vitest (`pnpm test`) and E2E with Playwright (`pnpm test:e2e`).
- Test specification is in `docs/08-test-specification.md` (normal/edge/error cases are all required).

## Commit & Pull Request Guidelines

- This snapshot does not include Git history, so no established commit message convention is visible.
- Use short, imperative commit messages (e.g., "Add report filter state").
- Start development work on a separate branch (do not work directly on `main`).
- PR body sections are fixed per change type; the canonical spec is `.claude/rules/pr-description.md` (do not restate its sections here). The files under `.github/PULL_REQUEST_TEMPLATE/` are skeletons of that rule (select one with `gh pr create --template <name>.md`).
- Attach screenshots for UI changes (before/after). This is not part of the PR body sections.

## Rules

Detailed rules live in `.claude/rules/` (canonical; do not duplicate their text here). See the table in `CLAUDE.md` for the full list and scopes.

Always applied (no glob scope):

- `.claude/rules/pr-description.md` — required sections of the PR description, by change type.
- `.claude/rules/lessons-learned.md` — how to record lessons learned into `docs/lessons-learned.md`.
- `.claude/rules/codex.md` — how Codex should operate here: read every `AGENTS.md` from the repository root down to the file being changed, translate Claude-Code-specific features into their Codex equivalents (ask before guessing), and **never approve or merge a pull request**.
- `.claude/rules/production-data.md` — **never write to the production database.** There is no development Supabase environment: the only Supabase project is production, and the only disposable database is the Testcontainers Postgres that `pnpm test:integration` starts. Supabase MCP is connected, so write tools (`execute_sql` with DML/DDL, `apply_migration`) reach production directly — use read-only tools only, and stop and report instead of switching targets to work around an error.

## Agent-Specific Notes

- The UI stores local-mode data in `localStorage` (see `front/src/components/AppStateProvider.tsx`), so verify behavior with fresh storage when debugging.
- Deployment is Vercel, `main` branch only, `front/` directory only, no preview.
- Database migrations are禁止 (no migrations). Schema changes must be reflected only in code files and applied in the separate DB project by the owner.
- Always read `docs/11-tasks.md` before starting work to align on remaining tasks and completion status.
- After each completed task, update `docs/11-tasks.md` and this file if requirements or workflows changed.
