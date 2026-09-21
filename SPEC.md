# Paint-by-Numbers PWA — Short Spec

Last updated: 2026-09-21

## What it is
A web app that runs in Safari on the iPad (PWA, "Add to Home Screen"). Loads a photo, converts it into a paint-by-numbers template, and provides a paint canvas with Apple Pencil support.

## Mode
**Free painting** — no region-clipping logic, no color checking. The template (black outlines + numbers) sits as a layer over the paint canvas. The user picks a color from the numbered palette and paints over it with the Pencil. The template can be toggled on/off.

## Screens
1. **Start** — "Choose photo" (opens the iOS picker)
2. **Prep** — image preview + detail-level presets (five cards: Kids, Easy, Standard, Detailed, Fine), "Generate template"
3. **Paint** — fullscreen canvas, palette at the bottom, toolbar at the top (brush/eraser/zoom/template toggle/save)

## Pipeline (in a Web Worker)
1. Scale the image to max. 2000 px on the long side
2. k-means in the LAB color space → palette + ID map. Centroids are fitted on a ~250k-pixel subsample (evenly strided) for speed; all pixels are then assigned to the final centroids in one pass. k-means++ initialization, 12 Lloyd iterations.
3. 3×3 majority filter on the ID map (smooths noisy pixel-level cluster assignment)
4. Connected components (4-neighbour flood fill) → regions
5. Merge tiny regions into their largest neighbour, up to 8 passes; the minimum region size is `minPx = clamp(40, 8000, w * h * minPxFactor)`, with `minPxFactor` coming from the selected preset
6. Outlines: a raster edge mask, not vector contours — a pixel is marked as an edge if its color ID differs from its right or bottom neighbour, or if it sits on the image border. No bilateral filter, no marching squares, no Douglas-Peucker simplification, no SVG.
7. Number placement: an approximate inscribed-circle center per region (distance to the region edge sampled along 4 axes on a grid), with the sampling step scaled to region size for performance. Numbering runs on the visible fields — connected areas enclosed by the outline mask — so every field the user sees carries exactly one number, even when two fields are joined by a 1 px neck. Regions whose inscribed radius is below 3 px get no number.
8. Output from the worker: the raster line/edge image (RGBA, transparent except black edges) plus the palette and number positions. The main thread draws the final template — a PNG bitmap with the edge lines and the numbers rendered on top (canvas `fillText`/`strokeText`, font size clamped to `7–22 px`, capped at `radius * 1.05`) — there is no SVG output.

## Detail presets
Five fixed presets (not a slider), each with a color count `k` and a `minPxFactor` that controls the minimum region size:

| Preset | Colors (k) | minPxFactor |
|---|---|---|
| Kids | 8 | 0.0015 |
| Easy | 16 | 0.0008 |
| Standard (default) | 24 | 0.0004 |
| Detailed | 36 | 0.00025 |
| Fine | 50 | 0.00015 |

## Storage
IndexedDB. Per project: original image, template bitmap (PNG), palette, paint-canvas bitmap. "Resume" list on the start screen. Backup export/import as a `.pbn.json` file (original + template + palette + paint state); the primary export path is `navigator.share()` with a file attachment (iOS share sheet), falling back to `<a download>` on desktop. Undo stack (10 steps of PNG-blob canvas snapshots).

## Stack
Vanilla HTML + CSS + JS, one Web Worker for the pipeline. No external libraries for the core pipeline (hand-written). One on-demand exception: pdf-lib (1.17.1), shipped in `vendor/` and loaded only when the user exports a PDF; the service worker precaches it, so the export works offline and no third-party host is contacted. PWA manifest + Service Worker for offline support.

## Design
From `antigravity-portfolio-prompt.md`:
- Background Deep Black `#0A0A0A`
- Accent Warm Orange `#E8651A`
- Secondary Warm Brown `#3D2B1A`
- Serif headlines, sans-serif body
- The paint-canvas area stays a neutral light grey (`#EEEEEE`)

Tone from `stimmen-profil.md`: short, direct, no corporate-speak.

## Pencil
PointerEvents API. `pointerType === 'pen'` enables pressure- and tilt-sensitive strokes. Default brush: soft round brush, size 8–30 px depending on pressure.

## Export
- **Direct browser print** via `window.print()` (a dedicated print stylesheet shows the numbered template).
- **PDF export** (`exportPDF()`, pdf-lib loaded on demand) — a two-page PDF: page 1 the numbered template on A4 (orientation-aware, portrait or landscape depending on the image), page 2 a color legend as a 4-column grid (swatch + number + hex).
- A print-options modal lets the user pick between the two.

## Out of Scope (first version)
- Region clipping
- Color checking / progress tracking
- Cloud sync
