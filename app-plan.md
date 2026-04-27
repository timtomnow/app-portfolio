# App Portfolio — Build Plan

A staged plan for building **App Portfolio**, a public showcase site hosted on GitHub Pages. Each stage is scoped so you can drop a single prompt into Claude Code that says *"Review `CLAUDE.md` and execute Stage N of `app-plan.md`"* and get a coherent, isolated chunk of work.

---

## 1. High-level decisions (read first)

### 1a. Recommended tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Vite + React + TypeScript** | Fast dev server, tiny build, first-class GitHub Pages support, types catch the many small mistakes that creep into a CRUD UI. |
| Styling | **Tailwind CSS** | Minimalist, professional out of the box; lets you add accent colors without authoring a design system. |
| Routing | **react-router-dom** (HashRouter) | HashRouter avoids the GitHub Pages 404-on-refresh trap without needing a custom 404.html. |
| Data store | **A single `src/data/apps.json`** committed to the repo | The site is static — no DB needed. The "database" is a JSON file edited by the admin UI and saved via commit. |
| Icons | **lucide-react** | Clean, professional, single dependency. |
| Asset tooling | **Playwright** (local CLI under `/tools`) | One library captures both screenshots and screen-recordings on desktop *and* mobile viewports. |
| Deploy | **GitHub Actions → GitHub Pages** | Zero-config, free, plays well with Vite. |

Total runtime dependencies: ~5. Build output is static HTML/JS/CSS — no server required.

### 1b. Auth strategy for a public repo (the trickiest question)

**Recommendation: local-dev admin pattern.** No password is shipped to production at all.

- The deployed site has **zero admin UI**. It is purely read-only HTML/JS — there is nothing to break into.
- You run `npm run dev` locally to get the full admin UI. A Vite env var (`VITE_ADMIN_MODE=true` in a gitignored `.env.local`) gates the admin routes/components, and Vite tree-shakes them out of production builds when the var is unset.
- "Saving" an app in the admin UI writes to `src/data/apps.json` on disk. You then `git commit && git push` and GitHub Actions redeploys.
- Result: no secret needs to live in the public repo, no auth code runs in production, and the surface area for attack is zero.

**Why not a password-in-repo approach?** Even a bcrypt-hashed password committed to a public repo is brute-forceable offline and gives anyone who cracks it write access to your portfolio via a UI you'd have to ship. Removing the admin UI from production entirely is both *simpler* and *strictly more secure* than gating it.

**Optional second tier (only if you later want to edit from your phone):** add a thin GitHub OAuth flow where you paste a fine-scoped Personal Access Token, and the admin UI commits via the GitHub Contents API. Defer this until you actually need it — it's a Stage 10+ extension, not core.

### 1c. Asset generator: separate app or in-repo?

**Recommendation: keep it in this repo, under `/tools/asset-gen/`.**

Reasons:
- The generator is a local-only admin tool, same audience as the admin UI — no value in a second repo.
- Output paths drop straight into `public/assets/<app-slug>/`, no cross-repo file shuffling.
- One `CLAUDE.md` to maintain, one set of dependencies, one deploy target.
- Playwright is a dev dependency — it never ships to GitHub Pages.

The generator will be a small Node CLI (`npm run gen:assets`) that takes either CLI args or a config object and writes screenshots + an MP4 demo video into the assets folder. The admin UI gets a "Generate assets" button that shells out to the same CLI when running locally.

A manual-upload path (drag-and-drop or file picker in the admin UI that copies into `public/assets/<slug>/`) is also included so you're never blocked when the generator can't reach a site.

---

## 2. Project structure (target)

```
app-portfolio/
├── .claude/
│   └── settings.local.json        # Claude Code per-repo permissions
├── .github/
│   └── workflows/
│       └── deploy.yml              # Build + deploy to Pages
├── public/
│   └── assets/
│       └── <app-slug>/             # Per-app icons, screenshots, demo.mp4
├── src/
│   ├── components/                 # Card, Header, Modal, etc.
│   ├── pages/
│   │   ├── About.tsx
│   │   ├── Portfolio.tsx
│   │   └── AppDetail.tsx
│   ├── admin/                      # Tree-shaken out in production
│   │   ├── AdminRoute.tsx
│   │   ├── AppForm.tsx
│   │   └── saveApps.ts             # Writes apps.json (dev server only)
│   ├── data/
│   │   └── apps.json               # The source of truth
│   ├── types.ts
│   ├── App.tsx
│   └── main.tsx
├── tools/
│   └── asset-gen/
│       ├── index.ts                # Playwright CLI
│       └── README.md
├── .env.local.example
├── .gitignore
├── CLAUDE.md
├── README.md
├── app-plan.md
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Data model

```ts
// src/types.ts
export type DeviceType = 'desktop' | 'mobile';

export type AppEntry = {
  slug: string;              // URL-safe id, e.g. "task-tracker"
  name: string;
  description: string;       // 1-3 sentences, plain text or basic markdown
  complexity: 1 | 2 | 3 | 4 | 5;
  liveUrl?: string;
  repoUrl?: string;
  iconPath: string;          // e.g. "/assets/task-tracker/icon.png"
  screenshots: { path: string; caption?: string; device: DeviceType }[];
  demoVideo?: { path: string; device: DeviceType };
  createdAt: string;         // ISO date
  updatedAt: string;
};
```

`apps.json` is just `{ "apps": AppEntry[] }`.

---

## 4. Stages

Each stage below is sized to be a single Claude Code session. Use the "Prompt" line as the literal request to send.

---

### Stage 1 — Repository hygiene & Claude config

**Goal:** Populate the empty repo with the baseline files a public, professional repo expects, plus Claude Code's per-repo permissions.

**Deliverables:**
- `.gitignore` (Node + Vite + macOS + `.env.local` + `dist/` + Playwright artifacts)
- `README.md` (one-paragraph description, "Live site" link placeholder, "Tech stack", "Local dev", "How content is updated" sections)
- `CLAUDE.md` (project context: stack, structure, conventions, "edit `apps.json` to add apps", "admin UI is dev-only", how to run asset-gen)
- `.claude/settings.local.json` with sensible auto-approve permissions (`Bash(npm:*)`, `Bash(git:*)`, `Read`, `Edit`, `Write` within the repo)
- `LICENSE` (MIT — pick whatever you prefer; this is reasonable for portfolio code)

**Exit criteria:** `git status` shows only the new files; `cat CLAUDE.md` reads as a useful onboarding doc for a future agent.

**Prompt:**
> Review `app-plan.md` and execute Stage 1. Create the repository hygiene files described there. Do not start scaffolding the Vite app yet.

---

### Stage 2 — Vite + React + TS + Tailwind scaffold

**Goal:** A blank but well-configured app that builds and deploys.

**Deliverables:**
- `package.json` with `dev`, `build`, `preview`, `lint`, `gen:assets` scripts
- `vite.config.ts` with the correct `base` for GitHub Pages (`/app-portfolio/` if using project pages, or `/` for `<user>.github.io`)
- `tailwind.config.ts` + `postcss.config.js` + `src/index.css` with Tailwind directives and a small color palette (one accent color, neutral grays)
- `tsconfig.json`, `tsconfig.node.json`
- `index.html`, `src/main.tsx`, `src/App.tsx` rendering a "Hello, App Portfolio" placeholder
- `.github/workflows/deploy.yml` that builds on push to `main` and deploys to Pages

**Exit criteria:** `npm install && npm run build && npm run preview` works locally; pushing to `main` triggers a successful Pages deploy.

**Prompt:**
> Review `CLAUDE.md` and `app-plan.md`, then execute Stage 2. Scaffold the Vite + React + TS + Tailwind app and the GitHub Actions deploy workflow. Confirm the build succeeds before stopping.

---

### Stage 3 — Data model and seed content

**Goal:** Lock in the shape of an app entry and seed one or two example apps so the UI has something to render.

**Deliverables:**
- `src/types.ts` with `AppEntry` and supporting types
- `src/data/apps.json` with 1–2 placeholder entries (use an `examples` folder under `public/assets/` for placeholder icon/screenshots; a small SVG is fine)
- `src/data/loadApps.ts` — a tiny module that imports the JSON and returns typed `AppEntry[]` (sorted by `updatedAt` desc by default)

**Exit criteria:** `import { loadApps } from './data/loadApps'` returns typed data; `tsc --noEmit` is clean.

**Prompt:**
> Review `app-plan.md` Stage 3 and execute it. Create the types, the seed `apps.json`, and the loader. Add a placeholder asset so the seed entries are renderable.

---

### Stage 4 — Public read-only site (About + Portfolio grid + detail view)

**Goal:** The full visitor experience. No admin code yet.

**Deliverables:**
- `Header` with site title, nav links (About, Portfolio), subtle accent
- `pages/About.tsx` — short bio, links (GitHub, LinkedIn, email), placeholder text you'll fill in later
- `pages/Portfolio.tsx` — responsive grid of `AppCard` components
- `components/AppCard.tsx` — icon, name, 1-line description, complexity dots/stars, links to live site & repo, click-through to detail
- `pages/AppDetail.tsx` — full description, screenshots gallery (click to enlarge), embedded demo video if present, links
- HashRouter wiring in `App.tsx`
- Mobile-responsive (stack on narrow widths, grid on wider)

**Exit criteria:** `npm run dev`, click through About → Portfolio → an app detail; all routes work; deployed Pages build still green.

**Prompt:**
> Review `CLAUDE.md` and `app-plan.md`, then execute Stage 4. Build the public read-only site against the seed data. Aim for clean, professional, minimalist styling with one accent color.

---

### Stage 5 — Manual asset upload UX (still no admin auth)

**Goal:** Define how assets land in `public/assets/<slug>/` so later stages have a target to write to.

**Deliverables:**
- `public/assets/.gitkeep` and a documented folder convention (`public/assets/<slug>/icon.{png,svg}`, `screenshots/01-*.png`, `demo.mp4`)
- A small helper `src/admin/assetPaths.ts` that, given a slug, returns the canonical paths
- Update `README.md` and `CLAUDE.md` with the asset-folder convention
- No UI yet — this stage is conventions only, since file writes belong in Stage 7

**Exit criteria:** Conventions documented; existing seed data uses them.

**Prompt:**
> Execute Stage 5 of `app-plan.md`. Lock in the asset folder conventions and document them.

---

### Stage 6 — Local-only admin gate

**Goal:** Wire up the env-var gate so admin code only runs in dev.

**Deliverables:**
- `.env.local.example` documenting `VITE_ADMIN_MODE=true`
- A `useIsAdmin()` hook that reads `import.meta.env.VITE_ADMIN_MODE === 'true'` (Vite inlines this at build time)
- `<AdminRoute>` wrapper that renders children only when admin mode is on
- An "Admin" link in the header, hidden when `useIsAdmin()` is false
- Verify production build with the var unset has zero references to admin components (check `dist/` size and grep)

**Exit criteria:** `npm run dev` with `.env.local` present shows admin link; `npm run build && npm run preview` (no `.env.local`) does not include admin code.

**Prompt:**
> Execute Stage 6 of `app-plan.md`. Add the env-var-gated admin mode and verify production builds strip admin code.

---

### Stage 7 — Admin CRUD UI

**Goal:** Add/edit/delete app entries through a UI when running locally.

**Deliverables:**
- `pages/Admin.tsx` listing all apps with "Edit" and "Delete" buttons + a "New app" button
- `admin/AppForm.tsx` — controlled form for every field on `AppEntry`, including drag-and-drop file inputs for icon, screenshots, demo video
- `admin/saveApps.ts` — uses a small **dev-only Vite middleware plugin** (or a Node script invoked via `fetch('/api/save')`) that writes `src/data/apps.json` and copies uploaded files into `public/assets/<slug>/`. This only works under `npm run dev`; the endpoint does not exist in production.
- After save, surface a "Now run `git add . && git commit && git push` to publish" reminder

**Exit criteria:** You can add a new app with icon + screenshots from the UI, see it on the Portfolio page after a hot reload, and the resulting git diff is clean and committable.

**Prompt:**
> Review `CLAUDE.md` and execute Stage 7 of `app-plan.md`. Build the admin CRUD UI and the dev-server file-write plugin. Verify a round-trip: create app → assets land in correct folders → portfolio page renders it.

---

### Stage 8 — Asset generator CLI (`tools/asset-gen`)

**Goal:** One-command screenshot + demo-video capture.

**Deliverables:**
- `tools/asset-gen/index.ts` — Playwright script that:
  - Accepts a config (`{ slug, url, device: 'desktop'|'mobile', screenshots: { name, action? }[], video?: { durationSec, script } }`)
  - Launches a desktop or mobile viewport (Playwright has built-in device descriptors)
  - For each screenshot: navigates / runs an optional action (a tiny domain-specific list like `click:selector`, `wait:ms`, `fill:selector:value`), then captures
  - For the demo video: starts video recording, runs the script (max 60s, hard-capped), stops, transcodes to MP4 (Playwright's webm → ffmpeg if needed)
  - Writes everything to `public/assets/<slug>/`
- `npm run gen:assets -- --config tools/asset-gen/configs/<slug>.json`
- Per-app config files live in `tools/asset-gen/configs/<slug>.json` so re-running on update is one command
- A button in the admin UI's `AppForm` that, when in dev mode, triggers the same CLI for the current app

**Exit criteria:** Running `npm run gen:assets -- --config tools/asset-gen/configs/example.json` produces an icon, N screenshots, and a < 60s MP4 in the right folder.

**Prompt:**
> Execute Stage 8 of `app-plan.md`. Build the Playwright-based asset generator CLI and wire the "Generate assets" button in the admin form. Include an example config and verify a real run against a live URL.

---

### Stage 9 — Polish, accessibility, SEO

**Goal:** Make it feel finished.

**Deliverables:**
- Open Graph + Twitter card meta tags (your name, site description, a default OG image)
- Favicon + apple-touch-icon
- Lighthouse pass: a11y ≥ 95, perf ≥ 90 on a slow build
- Keyboard nav for the gallery, alt text on all images
- Subtle hover/focus states, page transitions kept light
- Final color/typography pass — confirm minimalist + one accent feel

**Exit criteria:** Lighthouse run on the deployed site hits the targets; site looks intentional, not templated.

**Prompt:**
> Execute Stage 9 of `app-plan.md`. Polish styling, accessibility, and SEO. Run Lighthouse on the preview build and report scores before stopping.

---

### Stage 10 — Launch checklist

**Goal:** Flip the repo public with confidence.

**Deliverables:**
- Confirm no secrets in git history (`git log -p | grep -i -E 'token|secret|password'`)
- Confirm `.env.local` is gitignored and not tracked
- Confirm production build contains no admin strings (`grep -r AdminRoute dist/` returns nothing)
- Update `README.md` with the live URL
- Tag `v1.0.0`
- Make repo public
- (Optional) Add the URL to your GitHub profile / resume

**Exit criteria:** Repo is public, site is live, you've shared the URL with one person.

**Prompt:**
> Execute Stage 10 of `app-plan.md`. Run the launch checklist and report any items that need my action before I make the repo public.

---

## 5. Future extensions (out of scope for v1)

- **Edit-from-anywhere admin:** GitHub OAuth + Contents API so the admin UI can commit without local dev.
- **Analytics:** Plausible or Cloudflare Web Analytics (privacy-friendly, no cookies).
- **Tags / filtering:** filter portfolio by tech, complexity, or year.
- **RSS feed** of new apps added.
- **Dark mode** toggle.

Park these — adding them now is the kind of premature feature creep that bogs v1 down.
