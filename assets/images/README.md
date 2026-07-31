# Images

Drop your images into the matching folder:

- `hero/` — hero background, portrait, brand imagery
- `projects/` — project screenshots / thumbnails
- `og/` — social share image (1200x630) used by Open Graph/Twitter cards

## Project screenshots

The site expects one optimized pair per project — a `.webp` (modern) and a `.jpg` (fallback), e.g. `crashout.webp` + `crashout.jpg`. Projects without real screenshots use an abstract `*.svg` placeholder instead.

To add a real screenshot:

1. Save your screenshot as `assets/images/projects/<slug>.png`
2. Create the optimized pair (example — needs `sharp`):
   ```
   npx sharp-cli -i in.png -o out.webp --quality 80 resize 1200
   npx sharp-cli -i in.png -o out.jpg --quality 82 resize 1200
   ```
   or any tool that outputs a ≤1200px-wide WebP + JPEG.
3. Reference it in the project's `img: { webp: "…", jpg: "…" }` field in `js/data.js`.

## Generate all abstract placeholders

The `*.svg` placeholders (hero, about, og, project fallbacks) are plain text files — they can be regenerated or hand-edited. Files can be `.png`, `.jpg`, `.webp`, or `.svg`; if a referenced image is missing the card still renders (no broken layout, since each image has a reserved aspect ratio).
