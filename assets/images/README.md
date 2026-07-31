# Images

Drop your images into the matching folder:

- `hero/` — hero video + poster, About video
- `projects/` — project screenshots / thumbnails
- `og/` — social share image (1200x630) used by Open Graph/Twitter cards

## Hero video

The hero plays a looping, muted, 9:16 MP4: `hero/video-hero1.mp4` (H.264, ~1080x1920). To replace it:

1. Drop your MP4 in `assets/images/hero/` and update the `<source>` path in `index.html`.
2. Keep a poster image: `assets/images/hero/hero-poster.webp` + `.jpg` (720x1280). Extract a frame with ffmpeg, e.g.:
   ```
   ffmpeg -ss 0.2 -i in.mp4 -frames:v 1 -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2" -c:v libwebp -quality 82 hero-poster.webp
   ```
   Keep a 4K/oversized video under ~5MB by re-encoding to 1080x1920 if needed.

## About portrait

The About section plays a looping, muted, 9:16 MP4: `hero/video-hero2.mp4` (H.264, 1080x1920). Its poster is `about.webp` + `about.jpg` at the repo root of `assets/images/` (e.g. `assets/images/about.webp`) — the still shown before the video loads. Replace it with any 9:16 image and keep both the `.webp` and `.jpg` pair.

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
