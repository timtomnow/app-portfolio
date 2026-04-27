# App Portfolio — Claude Context

## What this project is

A fully static portfolio site hosted on GitHub Pages. The deployed site is read-only. The owner (timtomnow) runs the admin UI locally via `npm run dev` with `VITE_ADMIN_MODE=true`, edits content, and publishes by committing and pushing to `main`.

## Tech stack

- **Vite + React + TypeScript** — framework and build tool
- **Tailwind CSS** — all styling; no CSS modules or styled-components
- **react-router-dom v6** with `HashRouter` — required for GitHub Pages (avoids 404 on direct URL access)
- **lucide-react** — icons only
- **Playwright** — dev-only, used by the asset generator CLI in `/tools/asset-gen/`

## Project structure

```
src/
  components/     # Shared UI components (Card, Header, etc.)
  pages/          # Route-level components (About, Portfolio, AppDetail, Admin)
  admin/          # Admin-only code — tree-shaken out of production builds
  data/
    apps.json     # Single source of truth for all portfolio entries
    loadApps.ts   # Typed loader for apps.json
  types.ts        # AppEntry and related types
  App.tsx         # Router and layout
  main.tsx        # Entry point

public/
  assets/
    <app-slug>/   # Per-app: icon.{png,svg}, screenshots/*.png, demo.mp4

tools/
  asset-gen/      # Playwright CLI for generating screenshots and demo videos
    configs/      # Per-app JSON configs for the generator
```

## Data model

Each app entry in `src/data/apps.json` has this shape (see `src/types.ts` for the canonical definition):

```ts
{
  slug: string,           // URL-safe id, e.g. "task-tracker"
  name: string,
  description: string,    // 1-3 sentences, supports basic markdown
  complexity: 1|2|3|4|5, // shown as dots or stars in the UI
  liveUrl?: string,
  repoUrl?: string,
  iconPath: string,       // "/assets/<slug>/icon.png"
  screenshots: { path: string; caption?: string; device: "desktop"|"mobile" }[],
  demoVideo?: { path: string; device: "desktop"|"mobile" },
  createdAt: string,      // ISO date
  updatedAt: string
}
```

## Admin pattern (important)

- `VITE_ADMIN_MODE=true` in `.env.local` (gitignored) enables the admin UI.
- Admin code lives in `src/admin/` and is gated by a `useIsAdmin()` hook that reads `import.meta.env.VITE_ADMIN_MODE`.
- Vite inlines this at build time — when the env var is absent, the admin branch is dead code and tree-shaken from `dist/`.
- **Never import admin components from outside `src/admin/` without wrapping in the admin gate.**
- Saving from the admin UI writes `src/data/apps.json` and copies files into `public/assets/<slug>/` via a Vite dev-server plugin. This plugin only registers in dev mode.

## Asset conventions

```
public/assets/<slug>/
  icon.{png,svg}          # Square app icon, min 256×256
  screenshots/
    01-<description>.png
    02-<description>.png
    ...
  demo.mp4                # Max 60 seconds
```

Device type (`desktop` | `mobile`) is stored on the entry, not in the filename.

## Asset generator

```bash
npm run gen:assets -- --config tools/asset-gen/configs/<slug>.json
```

Config shape:
```json
{
  "slug": "my-app",
  "url": "https://my-app.example.com",
  "device": "desktop",
  "screenshots": [
    { "name": "01-home", "action": null },
    { "name": "02-detail", "action": "click:.some-button" }
  ],
  "video": { "durationSec": 30, "script": ["wait:1000", "click:.cta"] }
}
```

Actions are a small DSL: `click:<selector>`, `wait:<ms>`, `fill:<selector>:<value>`.

## Conventions

- **No comments** unless the WHY is non-obvious.
- **Tailwind only** — do not introduce other CSS mechanisms.
- **No new dependencies** without a clear reason; keep runtime deps minimal.
- **TypeScript strict** — `tsc --noEmit` must pass before any commit.
- App entries are sorted by `updatedAt` descending in the public UI.
- The `slug` field is the stable identity of an app — changing it breaks asset paths.

## Build & deploy

- `npm run build` — produces `dist/` (pure static files, no admin code)
- Push to `main` → GitHub Actions runs build → deploys to GitHub Pages
- Preview locally: `npm run build && npm run preview`

## Running the plan

The staged build plan lives in `app-plan.md`. Each stage has a self-contained prompt. To continue from any stage: *"Review `CLAUDE.md` and execute Stage N of `app-plan.md`."*

## IMPORTANT - preferences

When prompted to execute a stage or make other edits, make the changes and end your summary output of what was done with a git commit title and description for the user to review before they post the commit themselves.
