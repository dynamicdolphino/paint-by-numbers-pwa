# BACKLOG.md — Paint by Numbers PWA

> What's next. Each entry includes a sketch + location in the code so work can start directly.
> Format: `## [Status] Title` — Status is `Next`, `Later`, `Idea`.

---

## [Next] Device check on a real iPad with Apple Pencil

| ID | Prio | Topic |
|---|---|---|
| D-01 | P1 | Verify palm rejection (R-06) and focal-point pinch zoom (R-07) on the device — so far only checked with synthetic pointer events in a desktop browser. |
| D-02 | P2 | Measure template generation on the oldest iPad in use (Fine preset, 2000 px photo) — desktop: 1.6 s after the subsampling change (R-11). |
| D-03 | P2 | Check the new app icon on the home screen and the PDF export with the SRI hash on iOS. |
| L-01 | P1 | Before promotion: set the real Buy-me-a-coffee profile in `BMC_URL` (`index.html`) — currently the buymeacoffee.com homepage. |
| L-02 | P2 | Like counter depends on the free service abacus.jasoncameron.dev (keys expire after long inactivity, no SLA). If it disappears the button still works locally and shows the cached count; consider an own endpoint once traffic justifies it. `LIKE_BASE = 34` is a fixed offset chosen by the owner, not measured likes. |
| L-03 | P3 | `loadFromFile` uses `img.decode()`, which stalls while the tab is hidden (seen in the embedded test browser only). `createImageBitmap(file)` would avoid it — check HEIC support on iOS first. |
| L-05 | P1 | ⚠️ Rights of `example.jpg` (cat photo supplied by the owner on 2026-09-21) are unverified. Before promotion confirm it is the owner's own photo or under a license that allows web use without attribution (e.g. Unsplash/Pexels); otherwise add the credit or swap the file and rerun the asset scripts. |
| L-04 | P3 | Theme toggle exists only on the start screen; the paint and setup screens follow the chosen theme but offer no switch. Add one to the paint header if users ask. |
| D-04 | P3 | Modals have Escape / backdrop close and initial focus, but no full focus trap (rest of R-18). `user-scalable=no` stays: deliberate for a drawing surface. |

---

## [Later] Nice-to-haves

- Brush-shape selection (round / rounded-square / wide)
- Hover indicator for pencil devices (shows where the stroke would land before touching down)
- Multiple open projects visible in parallel as a gallery (instead of just a list)
- Direct export into the iOS photo album (via `navigator.share` with an image file — has worked correctly since the 0.7.0 fix)
- "Quick fill": tapping a region fills the whole region with the active color (opt-in, since it softens the "free painting" philosophy)
- Multilingual UI (German / English) — currently fully English
- Icon labels in the floating toolbar too (Brush/Eraser/Undo) — deliberately left out in 0.7.0, but worth adding if new users also get stuck there
- First-launch mini tour (bubble highlights for each tool after the first project) — if the static labels aren't enough

## [Idea] Possibly, depending on demand

- WebRTC sync across multiple iPads (two people painting the same picture)
- AI suggestion "this color fits now" (locally via onnxruntime-web, a small model)
- Difficulty analysis ("this image has a lot of small regions, want to try the Easy preset first?")

---

## Done in 0.13.0 (2026-09-21)

- ✅ Real photo as example everywhere (slider, steps, tutorial, feature pictures, README screenshots)

## Done in 0.12.0 (2026-09-21)

- ✅ Light theme with system default + toggle
- ✅ Feature showcase with screenshots (levels, paint screen, PDF pages), steps directly under the hero, import-backup button in the hero

## Done in 0.11.0 (2026-09-21)

- ✅ Landing redesign with visible feature overview, before/after example, "Try the example", like counter, coffee links
- ✅ Numbering per visible field (1 px neck bug)

## Done in 0.10.0 (2026-09-21, remaining review findings)

- ✅ R-06 — Palm rejection: touches are ignored while the Pencil is down, the Pencil wins over touches already resting; a stroke cancelled by a pinch gets its undo entry and autosave
- ✅ R-07 — Pinch zoom keeps the point under the fingers fixed; desktop: wheel / trackpad pinch zoom at the cursor, two-finger scroll, middle button or Space + drag pan
- ✅ R-10 — Regions are relabelled after merging (one number per visual field), merge runs up to 8 passes, numbers down to 3 px inscribed radius (font min. 7 px)
- ✅ R-12 — Undo stores dirty rectangles from a mirror canvas instead of full-canvas PNGs; 30 steps, 96 MB cap
- ✅ R-13 — 320 px JPEG thumbs, list reads metadata via cursor, legacy projects are migrated on first list render, ImageBitmaps are closed
- ✅ R-15 — `og-image.png` (1200×630) + `og:image` / `twitter:image`, favicon link
- ✅ R-16 — 8 unit tests for the worker pipeline (`npm test`, Node test runner, no dependencies) + GitHub Actions workflow
- ✅ R-17 — README in portfolio format with screenshots; SPEC, brief, MEMORY, CHANGELOG, BACKLOG in English and matched to the implementation
- ✅ R-18 — Project rename (header title is an input), clear painting (two taps, undoable), "% painted" indicator, Escape / backdrop close for modals
- ✅ SRI hash for the pdf-lib CDN load (sha512 as published by api.cdnjs.com, verified against a local hash of the file)

## Done in 0.9.1 (2026-09-21, review fixes, verified locally in the browser)

- ✅ R-01 — `icon-192.png` / `icon-512.png` never existed in the repo (404 live). `cache.addAll()` is atomic, so the servi…
- ✅ R-02 — `bindPaintEvents()` runs on every `setupPaint()`, listeners stack up. After opening a second project in one se…
- ✅ R-03 — Start screen does not scroll (`body` and `.screen` clip). At 375×812 with projects the headline is cut at the…
- ✅ R-04 — Project list shows only the 6 newest (`slice(0, 6)`); older projects can neither be opened nor deleted and kee…
- ✅ R-05 — Eraser `drawLine` leaves transparent pixels (only `drawDot` refills white) — measured RGBA 0,0,0,0. Exported P…
- ✅ R-08 — XSS regression from 0.9.0: print legend builds `innerHTML` from `p.r/g/b/nr`, which come unvalidated from an i…
- ✅ R-09 — `loadFromFile` has no error handling: undecodable file (HEIC outside Safari, corrupt) → unhandled rejection, n…
- ✅ R-11 — k-means runs on every pixel (2000 px image, k=50: ~2.4 bn distance evaluations) with a 90 s kill timer — older…
- ✅ R-14 — Like counter is a hard-coded fake (`12431`, "Loved by painters") on a public, indexed page — remove or back wi…

## Done in 0.8.0

- ✅ ~~Print PDF of the template~~ — pdf-lib via CDN (on-demand), print button in the paint header, A4 with template + color legend
- ✅ ~~loadScript() helper~~ — generic on-demand loader for future optional libraries

## Done in 0.7.0

- ✅ ~~"Fewer colors" preset~~ — five presets instead of a slider, with `minPxFactor` for kid-appropriate field sizes
- ✅ ~~Nicer UI for color selection~~ — slider replaced with preset pills
