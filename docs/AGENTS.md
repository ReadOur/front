# Repository Guidelines

## Project Structure & Module Organization
- Source lives in `src/`. Entry points: `src/main.tsx`, `src/App.tsx`.
- Components: `src/components/<Component>/<Component>.tsx` with a local `index.ts` barrel. Use PascalCase for component folders/files.
- Pages and features: `src/pages/` and `src/features/` (some files use code-style IDs, e.g., `HOM_01.tsx`, `ChatDock.tsx`).
- Styles: `src/style/` (Tailwind CSS 4, tokens, globals). Assets in `src/assets/`. Static files in `public/`.

## Build, Test, and Development Commands
- `npm run dev` — start Vite dev server for local development.
- `npm run build` — type-check (TS project refs) and build with Vite.
- `npm run preview` — serve the production build locally.
- `npm run lint` — run ESLint across the project.
- `npx vitest` — run unit/component tests; add `--coverage` for coverage.

## Coding Style & Naming Conventions
- Language: TypeScript + React. Prefer function components and hooks.
- Components in PascalCase; non-component modules in camelCase. Keep colocated `index.ts` barrels for component folders.
- Formatting via Prettier: single quotes, semicolons, trailing commas, 100 print width, 2‑space indent (see `.prettierrc`).
- Linting via ESLint flat config (`eslint.config.js`) with React Hooks and Vite refresh rules; Prettier integration enabled.

## Testing Guidelines
- Framework: Vitest + Testing Library (`@testing-library/react`, `jest-dom`) with jsdom.
- Colocate tests next to code or under `src/__tests__/` using `*.test.ts`/`*.test.tsx`.
- Test setup in `src/setupTests.ts`. Use Testing Library queries and avoid implementation details.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat:`, `fix:`, `chore:`, `docs:`). Keep messages imperative and concise.
- PRs: include purpose, linked issue/task, screenshots for UI changes, testing notes/steps, and any follow-ups. Keep diffs focused.

## Security & Configuration Tips
- Client-exposed env vars must start with `VITE_`. Store secrets in `.env.local` (do not commit).
- Avoid committing large binaries; place public assets in `public/` or `src/assets/` as appropriate.
