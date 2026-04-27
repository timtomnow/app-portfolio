# App Portfolio

A public-facing portfolio site showcasing apps built by [timtomnow](https://github.com/timtomnow). Visitors can browse an About Me page and a grid of app cards with links, descriptions, screenshots, and demo videos. The site is fully static, hosted on GitHub Pages, and updated by the owner via local dev tools and git commits.

**Live site:** https://timtomnow.github.io/app-portfolio/

---

## Tech stack

- **Vite + React + TypeScript** — fast builds, static output
- **Tailwind CSS** — minimal, professional styling
- **react-router-dom** (HashRouter) — client-side routing on GitHub Pages
- **Playwright** — local CLI for generating screenshots and demo videos

## Local dev

```bash
npm install
npm run dev          # starts dev server at http://localhost:5173
```

To enable the admin UI locally, create a `.env.local` file:

```
VITE_ADMIN_MODE=true
```

The admin UI is **not included in production builds** — only the read-only public site is deployed.

## How content is updated

1. Run `npm run dev` locally with `VITE_ADMIN_MODE=true`.
2. Use the Admin panel to add, edit, or remove apps. Changes write to `src/data/apps.json` and copy assets into `public/assets/<slug>/`.
3. Optionally run `npm run gen:assets -- --config tools/asset-gen/configs/<slug>.json` to auto-generate screenshots and a demo video.
4. Commit and push to `main` — GitHub Actions builds and deploys automatically.

## Asset folder structure

Each app's assets live under `public/assets/<slug>/` and follow this layout:

```
public/assets/<slug>/
  icon.png or icon.svg      # Square icon, minimum 256×256
  screenshots/
    01-<description>.png
    02-<description>.png
    ...
  demo.mp4                  # Demo video, max 60 seconds
```

The `device` field (`desktop` or `mobile`) is stored in `apps.json`, not in the filename. Assets can be added manually by dropping files into the correct folder, or generated automatically with `npm run gen:assets`.

## License

MIT © timtomnow
