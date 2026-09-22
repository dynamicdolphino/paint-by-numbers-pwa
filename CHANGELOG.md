# CHANGELOG

All notable changes to the project.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Newest entries **on top**.

---

## [0.15.1] — 2026-09-22 — FAQ and tablet layout

### Added
- "Questions and answers" section on the landing page: eight disclosure items (photos, detail levels, painting outside the lines, zoom/undo/clear, Apple Pencil, saving and backup, printing, offline/install), two columns from 900 px. The same questions are in the page as `FAQPage` structured data.

### Changed
- Tablets in portrait (640 to 899 px): steps in two columns with the first step as a wide 21:9 crop across the row, facts in two columns, showcase pictures and the hero comparison capped in height instead of filling the whole width at 4:3.
- Landing pictures regenerated through the real pipeline (`tests/example-assets.playwright.js`, `tests/feature-assets.playwright.js`, `tests/feature-assets.py`): the paint-screen picture now shows the 0.15.0 toolbar; `og-image.png` re-rendered from the new example.
- Service worker cache `pbn-v18`.

---

## [0.15.0] — 2026-09-22 — Landing page redesign (taste-skill pass)

### Changed
- Landing page rebuilt after an audit with the `taste-skill` design skill (redesign mode: keep content, brand accent and information architecture; new visual language). One type family now: the system sans for everything, headlines heavier and tighter (the serif display face is gone, also on the setup, paint and modal titles).
- Neutral palette instead of warm near-black/cream: dark `#0E0E10` with `#F4F4F5` text, light white with `#18181B` text; the orange accent, CTA and contrast tokens are unchanged. The radial glow behind the hero is gone. `theme-color` follows the new dark value.
- Hero is left-aligned on every width, holds four elements only (headline, one 19-word lead, two buttons, the import pill); the "free · no sign-up" eyebrow and the two check-mark claims were removed, the claims live in the "Private by design" statement. Headline fits in two lines at 42 px on desktop.
- Section labels (kickers) removed everywhere, headlines alone carry the structure.
- "How it works" is a three-cell grid (step 1 tall on the left, steps 2 and 3 stacked right) with the picture above each caption instead of three equal cards.
- Showcase: two split rows, then the PDF feature as one full-width row (was three alternating rows).
- Feature trio is a featured statement plus two dividers-only items instead of three equal cards; the support panel is one centered tinted block without gradient or border.
- Shape rule: interactive controls are pills, media and panels 16 px, small controls 10 px (`--radius-sm`, `--radius`).
- Motion: hero children stagger in once, sections rise on scroll via CSS `animation-timeline: view()` where supported; everything sits under `prefers-reduced-motion: no-preference`.
- Copy: no em-dashes in visible text (title, meta, landing, toasts, tutorial, PDF heading, manifest); lead shortened; "Continue painting: n projects".
- New app mark: one field of a template, paper tile with a contour line, the lower part painted orange, the number 3 above (`docs/logo.svg`; `icon-192.png`, `icon-512.png` and `og-image.png` rendered from it with `tests/icons.playwright.js`). Replaces the ring of color dots.
- Setup screen: from 900 px the controls sit in a 340 px panel beside the preview and the detail levels are a vertical list (name left, color count right); on phones they stay a row of larger pills. Each level has a one-sentence description under the list; "Generate template" moved from the header into the panel, full width. The preview lost its bordered box and sits directly on the stage with rounded corners.
- Paint screen: the floating tools are three glass groups (brush and eraser; undo, clear and the new "Fit to screen" button that resets zoom and pan; brush size as a vertical slider with a live dot showing the current size). Groups use the theme tokens, so they are light on the light theme instead of always dark. Swatches and icon buttons use the 10 px radius token.
- Service worker cache `pbn-v17`.

---

## [0.14.0] — 2026-09-21 — User walkthrough fixes: offline PDF, color hint, phone layout, CSP

### Added
- Color hint: picking a color flashes every field that belongs to it (orange overlay, 1.6 s). The worker returns a per-pixel color map; it is stored with the project as a PNG (`colorMapBlob`, red channel = color id) and travels in backups as the optional `colorMapDataURL`. Older projects and backups simply show no hint.
- "Continue painting — n projects" link under the hero buttons when projects exist.
- Content-Security-Policy `<meta>`: own origin only, plus `blob:` workers, `data:`/`blob:` images and the like counter host.
- `vendor/` with pdf-lib 1.17.1, its license and a README recording source and hash.

### Changed
- PDF export loads pdf-lib from `vendor/pdf-lib.min.js` instead of cdnjs; the service worker precaches it (`pbn-v16`). The export now works offline and the like counter really is the only third-party request, as the footer says.
- "Your projects" sits directly under the hero instead of below "How it works".
- Paint screen below 560 px: buttons on the first header row, project name and progress on their own row; the tools form one row across the top of the stage and `fitCanvas()` keeps the canvas below it.
- Palette numbers are black or white depending on the swatch luminance (was `mix-blend-mode: difference`, unreadable on mid tones). Swatches and level pills have accessible names and `aria-pressed`; the template toggle shows its state.
- "% painted" updates at the end of each stroke, not after the autosave delay.

### Fixed
- `loadScript()` left a failed `<script>` element behind, so every retry resolved without loading and the PDF export stayed broken until a reload.

---

## [0.13.0] — 2026-09-21 — Real photo as the example, pictures in the steps

### Changed
- The example is now a real photo supplied by the owner (sleeping tabby cat, `example.jpg`, 1200×900) instead of the procedural sunset. Everything derived from it is regenerated through the real pipeline: before/after slider (`example-after.jpg`, Standard level, 24 colors), feature pictures (levels, paint screen, PDF pages) and the README screenshots.
- "How it works" cards and the step-by-step tutorial show pictures of the three stages: photo → template (`step-2.jpg`) → painted (`step-3.jpg`).
- "Try the example" selects the Standard level. Compare frame and images are 4:3.
- Asset scripts unregister the service worker first (it serves assets cache-first and handed out the previous example). `tests/feature-assets.py` also converts the example-derived pictures.
- `sw.js` — cache `pbn-v15`, step pictures precached.

---

## [0.12.0] — 2026-09-21 — Light theme, feature showcase with screenshots, visible import

### Added
- Light (white) theme for the whole app. Default follows the system setting; a sun/moon button in the top bar stores an explicit choice (`localStorage.theme`). An inline script in `<head>` sets `data-theme` before first paint, `theme-color` follows.
- Feature showcase with real pictures: detail levels (Kids vs Fine template of the example), the paint screen with a partly painted example, and the two pages of the actual PDF export. Generated by `tests/feature-assets.playwright.js` + `tests/feature-assets.py`.
- "Import a backup (.pbn.json)" as its own button in the hero (was a text link at the bottom of the page).

### Changed
- "How it works" moves directly under the hero; the three steps are larger cards whose markers are numbered paint pots in colors of the example palette.
- Colors go through tokens (`--header-bg`, `--palette-bg`, `--overlay-bg`, `--stage-bg`, `--card-shadow`, `--accent-text`, `--cta`). Accent text and the primary button fill are darkened where needed to reach 4.5:1.
- Feature cards reduced to the three points the pictures do not cover (privacy, backup, install).
- `sw.js` — cache `pbn-v14`, feature pictures precached.

### Decisions
- White instead of a cream "paper" tone for the light theme — the owner asked for white, and the template itself is white.
- The user asked for a "taste" skill; none is installed, so the `frontend-design` skill was used together with the ui-ux-pro-max checklist. System fonts stay (offline app, no third-party font requests).

---

## [0.11.0] — 2026-09-21 — Landing redesign, example image, real like counter

### Added
- New start screen: top bar with like and coffee buttons, hero with one primary action, before/after compare slider (range input — drag, tap and arrow keys), feature grid (six cards), inline three-step explanation, support card, footer note.
- Example image: `example.jpg` (procedural sunset scene) and `example-after.jpg` (its template, half painted, produced by the real pipeline). "Try the example" loads the photo straight into the setup screen with the Easy level.
- Like button backed by a public hit counter (abacus.jasoncameron.dev, key `paint-by-numbers-pwa/likes`), one hit per browser, last count cached for offline use. `LIKE_BASE = 34` is the owner's chosen starting offset.
- "Buy me a coffee" links, fed from one constant `BMC_URL` (placeholder until the profile exists).
- `tests/example-assets.playwright.js` regenerates the example images; a unit test asserts that every file in the service-worker precache list exists.

### Fixed
- Numbering now follows the visible fields (areas enclosed by the drawn outlines) instead of raw color regions: two areas joined by a 1 px neck used to share one number, leaving a large visible field unnumbered. Found while generating the example.

### Changed
- "Your projects" moves below the hero and is hidden for first-time visitors; project cards use a responsive grid, 44 px touch targets, labelled delete button.
- Print dialog buttons use text instead of emoji; visible focus rings.
- `sw.js` — cache `pbn-v13`, example images precached.

### Decisions
- The design-system generator of the ui-ux-pro-max skill suggested a generic developer palette; the existing brand (black, warm orange, serif headlines) stays. Taken from the skill: the "before-after transformation" and "product demo + features" landing patterns and the checklist (44 px targets, no emoji icons, focus states, reduced motion, keyboard alternative to dragging).
- The like counter is the page's only third-party request; the footer says so. Photos still never leave the device.

---

## [0.10.0] — 2026-09-21 — Remaining review findings

### Added
- Palm rejection: touches are ignored while the Pencil is down; a Pencil coming down takes over from resting touches.
- Desktop navigation: mouse wheel / trackpad pinch zooms at the cursor, two-finger scroll pans, middle button or Space + drag pans.
- Project rename (the paint header title is an input), "clear painting" with two-tap confirm (undoable), "% painted" indicator.
- Escape and backdrop tap close the modals; focus moves into the dialog on open.
- `og-image.png` with `og:image` / `twitter:image`, favicon link, `mobile-web-app-capable` meta.
- Unit tests for the worker pipeline (`npm test`, Node test runner) and a GitHub Actions workflow; `package.json` with scripts only.
- `tests/screenshots.playwright.js` regenerates the README screenshots in `docs/screenshots/`.

### Changed
- Pinch zoom keeps the content point under the fingers fixed instead of scaling around the canvas centre.
- Undo: dirty rectangles copied from a mirror canvas replace full-canvas PNG snapshots — synchronous, 30 steps, capped at 96 MB.
- Project list reads metadata through a cursor and shows 320 px thumbs; projects saved before this version are migrated on first render. ImageBitmaps are closed when replaced.
- Numbering runs on regions relabelled after the merge (one number per visual field); merge up to 8 passes; numbers down to 3 px inscribed radius.
- Rename and autosave share one serialized write path (a concurrent autosave could overwrite a new name).
- `sw.js` — cache `pbn-v12`.
- README rewritten in the portfolio format; all repository docs are English now.

### Security
- pdf-lib is loaded with an SRI hash (sha512 as published by cdnjs, verified locally).

### Decisions
- `user-scalable=no` stays — the canvas handles its own zoom and browser zoom would fight the pinch gesture.
- Screenshots come from an opt-in Playwright script rather than a test dependency; the project keeps zero npm dependencies.

---

## [0.9.1] — 2026-09-21 — Review fixes

### Fixed
- Missing `icon-192.png` / `icon-512.png` added (they never existed; the atomic `cache.addAll()` made the whole service-worker precache fail). 512 px icon marked `any maskable`.
- Pointer listeners on the paint stage are bound once — previously every opened project added another set and strokes were drawn multiple times.
- Start screen scrolls; on phones the headline and the project cards' buttons were clipped.
- Project list shows all projects instead of the 6 newest (older ones could neither be opened nor deleted).
- Eraser lines refill white instead of leaving transparent pixels in the exported PNG.
- Undecodable image files show a toast instead of failing silently.

### Security
- Print legend no longer builds `innerHTML` from palette values; backup import validates size, data URLs and rebuilds the palette from clamped numbers.

### Changed
- k-means fits centroids on a ~250k px subsample and assigns all pixels once (2000×1400 px, 50 colors: 1.6 s on a desktop).
- Removed the hard-coded like counter ("12.4k · Loved by painters") and the placeholder "Buy me a coffee" link.
- `sw.js` — cache `pbn-v11`.

---

## [0.9.0] — 2026-05-21 — SEO + Discoverability + UX polish (Antigravity rework)

### Added
- **Complete SEO**: full meta-tag block (description, keywords, theme-color, author), OpenGraph (og:type/title/description/url/site_name), Twitter Card (summary_large_image), `<link rel="canonical">`
- `robots.txt` — allows indexing + points to the sitemap
- `sitemap.xml` — one URL (start page), priority 1.0, changefreq monthly
- **Tutorial modal** (`#tutorial`) — new "How does it work?" explanation for first-time users
- **Print-options modal** (`#print-sheet`) — user chooses between direct print and PDF save (previously PDF was the only option)
- **Like button** in the header with counter (`#like-btn` / `#like-count`)
- **Hero "Past Projects" section** with an empty state on the start screen
- **Generating overlay** (`#generating-overlay`) with status text "Analyzing colors…" while the worker runs
- A11y: `role="region"`, `aria-label`, `aria-hidden` on screens and modals

### Changed
- `manifest.webmanifest` — name extended to "Paint by Numbers — Custom Templates from Photos", longer SEO description, new field `categories: ["creativity", "design", "entertainment"]`
- `sw.js` — cache `pbn-v10`; `FILES` list extended with `robots.txt` and `sitemap.xml`
- `index.html` grew from 1905 to 2504 lines (+31%) — the full SEO/A11y/UX polish

### Decisions
- **Antigravity rework as a drop-in merge** — `MEMORY.md`, `BACKLOG.md`, `SPEC.md`, `brief.md`, `README.md` stayed unchanged, because the v2 work was a pure code/markup/SEO layer without an architectural break
- **Direct to `main` via branch `v0.9.0-antigravity-merge`** — solo repo, no PR review needed, the branch only serves diff visibility in the history
- **Like counter currently holds a static value (12.4k)** — deliberate, since backend integration would be beyond PWA scope; it stays decorative until telemetry/analytics is decided

---

## [0.8.0] — 2026-05-18 — Print PDF of the template

### Added
- Print button in the paint header (between `Template` and `Backup`) with a printer icon + `Print` label
- `exportPDF()` — generates a two-page PDF: page 1 numbered template on A4 (orientation-aware: landscape if the image is landscape, portrait if portrait), page 2 color legend as a 4-column grid (swatch + number + hex)
- `loadScript(src)` — generic on-demand loader, idempotent via `data-loaded-src`
- `dataURLToUint8Array()` and `rgbToHex()` as small helpers for the PDF pipeline
- pdf-lib (1.17.1) is loaded **on demand** from a CDN — offline sessions without a print need never pay the ~250 KB

### Changed
- `sw.js` — cache `pbn-v9`
- "Generating PDF…" toast with a 60 s timer (overwritten by the subsequent "PDF ready") — visible feedback while pdf-lib loads and embeds the PNG

### Decisions
- **pdf-lib via CDN, loaded dynamically** — avoids every startup pulling in the library; the CDN cross-origin request isn't cached by the Service Worker anyway, so there's no offline bonus to lose
- **The PDF path deliberately leaves the sync-gesture pattern** — `PDFDocument.create()` + `embedPng()` are unavoidably async. Instead of trying to force share() inside the gesture, we consistently use `openSaveSheet()`, whose modal buttons are fresh gestures. No more silent fail on iOS.

---

## [0.7.0] — 2026-05-17 — iOS backup fix + detail presets + discoverability

### Added
- `PRESETS` with five detail levels: Kids (8 / very coarse fields), Easy (16), Standard (24), Detailed (36), Fine (50 colors)
- Preset-pill selection on the prep screen (cards with label + color count + hint) — replaces the old slider
- `minPxFactor` per preset, passed through to the worker — "Kids" now really produces coarser fields, not just fewer colors
- Text labels under all header icons (`Back`, `Template`, `Backup`, `Save`) — new users immediately know what the buttons do
- Generic `openSaveSheet()` modal as a visible fallback when `navigator.share()` is rejected or unavailable
- Sync helpers `dataURLToBlobSync()` and `templateCanvasFromState()`

### Changed
- `state` extended with `projectName`, `projectCreatedAt`, `preset` (so backup runs synchronously without `dbGet()`)
- `backupProject()` now builds the JSON payload entirely synchronously from `state.*` and calls `navigator.share()` **before** any `await`
- `#save-btn` uses the same sync pattern (previously an async `toBlob` callback + silent `<a download>`)
- Worker threshold for `mergeTiny`: cap raised from 200 px to 8000 px, so coarse presets aren't clamped
- `sw.js` — cache `pbn-v8`

### Fixed
- **Saving a backup on iOS PWA: tap visibly did nothing.** Cause was gesture-token loss from `await`s before `navigator.share()`; iOS Safari then rejects silently and the `<a download>` fallback is ignored in standalone mode
- The save-image button had the same iOS bug (toBlob callback) — now also synchronous
- Backup-modal listener leak on repeated open without closing
- Object URL was revoked too early in the fallback, before the `<a download>` fetch had completed
- `importProject` gave a cryptic `SyntaxError` on a broken JSON file instead of a user-friendly message

### Removed
- `DETAIL_OPTIONS` array, `#detail-slider`, `#detail-value`
- Dead code `blobToBase64()` (backup now uses synchronous paths)

---

## [0.6.0] — 2026-05-16 — Project documentation + filename fix

### Added
- `brief.md` — project brief following the AI-SYSTEM template
- `MEMORY.md` — chronological log with decisions + rationale
- `CHANGELOG.md` — this file
- `formatProjectStamp()` — the new project name includes date + hour:minute

### Changed
- `index.html` — project name format changed from `'Project ' + toLocaleDateString` to `'Project YYYY-MM-DD HH:MM'`
- `sw.js` — cache `pbn-v7` (from v6)

### Fixed
- Multiple projects created on the same day had the same display name and backup file name

---

## [0.5.0] — 2026-05-16 — Backup via Web Share + race fix

### Added
- Prominent "Import backup" as a secondary button on the start screen
- `flushSave()` — synchronous save flush when leaving the paint screen

### Changed
- The backup button now uses `navigator.share()` with a file attachment (opens the iOS share sheet); falls back to a classic download on desktop
- `resumeProject()` catches errors and shows a toast instead of hanging silently
- `sw.js` — cache `pbn-v6`

### Fixed
- Saving a backup on iOS PWA didn't work (`<a download>` is ignored in standalone mode)
- Race condition: "Back" → immediately "Open" → incomplete blob → project couldn't be opened
- "or import a project backup" was too easy to miss (now its own button)

---

## [0.4.0] — 2026-05-16 — Undo + backup export/import + zoom fix

### Added
- Undo stack (10 steps, PNG blobs)
- Undo button in the floating toolbar (between eraser and brush slider)
- Backup export as `.pbn.json` (original + template + palette + paint state)
- Backup import on the start screen
- `pushUndo()` snapshot before every stroke start
- Toolbar `touch-action: manipulation` and pointer-event isolation

### Changed
- `fitCanvas()` now runs after `go('paint')` via `requestAnimationFrame`
- Touch strokes only start on the first `pointermove`, pen strokes start immediately
- `sw.js` — cache `pbn-v5`

### Fixed
- On first open, the image was too large and had to be zoomed out manually
- The brush slider and toolbar buttons triggered tiny strokes on the canvas
- 2-finger zoom left a tiny blob at the first finger's starting position

---

## [0.3.0] — 2026-05-16 — Detail, number layout, picker, persistence

### Added
- Inscribed-circle calculation (`innerPoint`) for number positions — the number is guaranteed to lie inside the region
- Dynamic `mergeTiny` threshold (~0.04% of image size) instead of a fixed 120 px
- `navigator.storage.persist()` for eviction-resistant IndexedDB
- The Service Worker uses network-first for navigations — new app versions ship without manually clearing the cache

### Changed
- Default detail level: 36 colors (previously 24)
- Maximum image resolution: 2000 px on the long side (previously 1600)
- Number font size now hard-capped at 22 px
- `sw.js` — cache `pbn-v3` / `pbn-v4`

### Fixed
- The photo picker showed only the camera on iPad (bug: `capture="environment"` on the file input)
- Numbers were huge on large regions and overlapped neighboring numbers
- Too few fields on detail-rich photos

---

## [0.2.0] — 2026-05-16 — Canvas layout fix + fully English UI

### Added
- Wrapper div `.canvas-stack` for the canvas stack
- Apple mobile-web-app meta tags
- English UI (instead of German — explicit user requirement)

### Changed
- The stage is now a flex container with `align-items: center; justify-content: center`
- The transform now sits on `.canvas-stack`, not on each canvas individually
- All user-visible strings translated (buttons, toasts, date formatting, manifest)

### Fixed
- The canvas was empty after template generation (layout bug: `transform: translate(-50%, -50%) scale(...)` computed incorrectly on large canvases)

---

## [0.1.0] — 2026-05-16 — First version, live on GitHub Pages

### Added
- `index.html` — the complete app in one file (HTML + CSS + main JS + worker source)
- `sw.js` — Service Worker for offline support
- `manifest.webmanifest` — PWA manifest
- `SPEC.md` — technical specification
- `README.md` — repo overview (English, since public)
- `LICENSE` — MIT
- Pipeline: k-means in LAB → median filter → connected components → tiny-region merge → edge extraction → numbering
- Paint canvas with Apple Pencil support (PointerEvents, pressure, tilt)
- IndexedDB project persistence, auto-save after every stroke (debounced)
- Photo import via the iOS picker
- GitHub repo `dynamicdolphino/paint-by-numbers-pwa` (public, for Pages)
- GitHub Pages live at `dynamicdolphino.github.io/paint-by-numbers-pwa/`

### Decisions
- **Web app instead of a native iPad app** — no Mac/Xcode/Apple account needed
- **"Free painting" instead of region clipping** — greater painting freedom, simpler implementation
- **Vanilla JS with no frameworks** — smaller bundles, easier to audit
- **GitHub Pages as host** — free, automatic deploy on every push to `main`
