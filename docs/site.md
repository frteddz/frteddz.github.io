# Site guide

Everything brand-specific lives in one file: `js/data.js`. Nothing else in the project hardcodes your name, links, colors, or projects.

## Editing copy & translations

- Text and translations live in `window.SITE.t.en` and `window.SITE.t.ar` (keyed by the `data-i18n` attributes in `index.html`).
- To add a project: add it under the right category in `window.SITE.projects` (give it a unique `slug`, plus `name`, `url`, optional `img`, and `desc`/`tag`/`alt` in both languages), then paste the card markup in `index.html` following an existing card's pattern — the card gets `data-project="<slug>"`, and desc/tag/alt render from the project data automatically.
- Project names (CrashOUT, AetherCoreMc…) are proper nouns and stay the same in both languages.

## Images

- `assets/images/projects/` holds one optimized `.webp` + `.jpg` pair per project (fallback `.jpg`). Drop a screenshot in, then reference it in the project's `img` field in `js/data.js`.
- Projects without a real image use the abstract `*.svg` placeholder. To give one a real screenshot, add the image and set `img: { webp: "name.webp", jpg: "name.jpg" }`.
- The hero/about/OG images are generated SVGs in `assets/images/` (`hero.svg`, `about.svg`, `og/og.png`). Replace `og/og.png` (1200×630) with a branded share image when you have one.

## Links & contact

- `docs/links.md` holds your social URLs. They are already wired into `js/data.js` → `window.SITE.links` (footer + contact buttons + JSON-LD `sameAs`). Keep both in sync.
- Email is currently `teddzfr@proton.me`. Change it in `js/data.js` → `links.email` / `links.emailPlain` and in the `mailto:` on `index.html`.

## Deploy (Vercel)

1. Push this folder to a GitHub repo.
2. In Vercel, import the repo — framework preset: **Other** (it's plain static). No build command needed.
3. The site is served as-is.

## Before going live

- Replace every `https://teddz.example.com/` with your real domain:
  - `index.html` (canonical, hreflang, OG/Twitter image URLs, JSON-LD `url`)
  - `sitemap.xml` and `robots.txt`
- Confirm the `og/og.png` image is a real branded 1200×630 image.

## Design tokens

Colors, fonts, spacing, and motion live in `css/base.css` (`:root` variables) — accent color `--accent`, background tones, type scale, and easing curves are all there. Layout/component styles are in `css/main.css`.
