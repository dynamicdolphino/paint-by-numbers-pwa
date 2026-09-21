# MEMORY.md — Paint by Numbers PWA

> Chronological log of the project.
> Newer entries at the bottom — following implementation order.

**Format per entry:**

```
## YYYY-MM-DD — Short title
**Context:** Situation
**Decision / Insight:** What
**Rationale:** Why
**Impact:** Consequence for future work
```

---

## 2026-05-16 — Web app instead of native

**Context:** Michael wanted a paint-by-numbers solution for iPad + Apple Pencil built from his own photos, without a third-party app and without wanting to deal with Xcode/Mac setup.

**Decision:** Single-file PWA (HTML/CSS/JS) instead of a native Swift app. Hosted via GitHub Pages.

**Rationale:** No Mac with Xcode needed, no Apple Developer account ($99/year), no 7-day re-sign requirement. Pencil support via the PointerEvents API has been stable since iPadOS 13.4. If performance/hover features are ever missing, a later jump to native remains possible because the template logic (SVG / JSON palette) stays portable.

**Impact:** The repo must be public (Pages on the free tier requires public). Service Worker + IndexedDB for offline persistence instead of App Store local storage.

---

## 2026-05-16 — "Free painting" instead of region clipping

**Context:** Three behavior options for the pencil strokes: (1) strict — stroke only inside the matching region, (2) mild — all strokes are drawn, a region only counts as "done" once the right color dominates, (3) free — the template is only a guide.

**Decision:** Option 3 (free painting).

**Rationale:** Greater painting freedom, significantly simpler implementation (no per-region clipping, no real-time color checking), closer to "real" painting. If demand for stricter behavior comes up later, it can be added as a switch.

**Impact:** The template is a single image layer with lines + numbers over the paint canvas, no per-region mask system.

---

## 2026-05-16 — k-means in LAB instead of RGB

**Context:** Color quantization has to match human perception, otherwise it clusters e.g. sky and skin tones together incorrectly.

**Decision:** k-means in the CIE-LAB color space, k++ initialization, 12 Lloyd iterations.

**Rationale:** LAB distances match human color perception far better than RGB. k++ prevents the most common class of bad cluster initializations.

**Impact:** Pipeline step 1. Output is an ID map (per pixel: cluster index) plus an RGB palette (mean per cluster in the original color space).

---

## 2026-05-16 — Number placement via inscribed circle

**Context:** The first implementation placed numbers at the bounding-box center of each region. For concave (L-shaped) or narrow regions, numbers ended up outside the visible field. Font size also scaled with the bounding box, producing huge numbers on large regions that overlapped others.

**Decision:** Per region, approximate the inscribed-circle center (distance to edge along 4 axes, sampled on a dense grid). Font size = `clamp(9, 22, radius * 1.05)`.

**Rationale:** The position is guaranteed to lie inside the region regardless of shape. Font size is capped so no number visually overlaps others.

**Impact:** Code in `makeNumbering` + `innerPoint`. Verified with a synthetic L-shape test (number lands in the L's leg instead of the empty bbox center).

---

## 2026-05-16 — Touch strokes deferred, pen immediate

**Context:** During 2-finger zoom, the first finger drew a tiny blob before the app recognized the second pointer as a pinch. On toolbar sliders (brush size), the pointerdown passed through to the canvas.

**Decision:** Pen strokes start immediately. Touch/mouse strokes wait for the first `pointermove` event — no point without movement. The toolbar container intercepts its own pointerdowns (early return in the canvas handler).

**Rationale:** Pencil by definition signals paint intent (no "accidentally touched down"). Touch, on the other hand, is ambiguous — only real movement signals paint intent.

**Impact:** Blob-free zoom start. Sliders work without stroke artifacts.

---

## 2026-05-16 — Backup via Web Share API

**Context:** iOS Safari in standalone PWA mode ignores `<a download>` — the backup was never actually saved.

**Decision:** The primary path is `navigator.share()` with a file attachment (opens the iOS share sheet → "Save to Files" / AirDrop / Mail). Fallback is `<a download>` for desktop browsers.

**Rationale:** Native iOS UX, no need to build a custom share sheet, works even when the app was launched from the home screen.

**Impact:** The backup button now shows the system share sheet. Import stays a classic file input.

---

## 2026-05-16 — flushSave against a race condition on exit

**Context:** Auto-save was debounced to 800 ms. Anyone who quickly tapped "Back" → "Open" would read the project from IndexedDB before the save had finished — the blob was missing, `createImageBitmap` failed, and the project couldn't be opened.

**Decision:** On exit, the save is flushed (timer cancelled, save run synchronously, awaited to completion). Only then does the screen change and the resume list render.

**Rationale:** Eliminates the race condition entirely. Costs at most ~200 ms of wait time when tapping back.

**Impact:** Projects are guaranteed to be fully persisted after "Back". `resumeProject` additionally catches errors and shows a toast if something is still missing.

---

## 2026-05-16 — Project name with date + time

**Context:** Two projects created on the same day had the same display name ("Project 5/16/2026") and thus the same backup file name.

**Decision:** The project name includes date + hour:minute in ISO style (`Project 2026-05-16 18:47`).

**Rationale:** Unique per minute, sortable as a string, filename-safe (sanitizing of backup files turns `:` and spaces into `-` anyway).

**Impact:** Multiple projects on the same day are now cleanly distinguishable in the project list and in backup file names.

---

## 2026-05-17 — iOS Web Share needs a synchronous user-gesture context

**Context:** Michael reported that saving a backup on the iPad "often doesn't work" — tapping the backup button and visually nothing happened. Reproducible in PWA standalone mode (home screen), not in a regular Safari tab.

**Decision / Insight:** The previous `backupProject()` ran `await flushSave()` → `await dbGet()` → `await blobToBase64()` before `navigator.share()`. iOS Safari drops the user-gesture token after the first `await`. By the time `share()` is called, it's gone, the call is rejected silently, and the `<a download>` fallback is completely ignored by iOS in PWA standalone mode. Net result: tap → nothing.

Fix: the backup payload is now built **entirely synchronously** from `state.*` (`canvas.toDataURL()` is sync, a dedicated `dataURLToBlobSync()` parses the base64 itself). `navigator.share()` runs within the same gesture. If it's still rejected or unavailable, a visible modal opens — its buttons are new gestures and can still share/`window.open`. So the backup doesn't have to wait on `dbGet()`, `state.projectName` and `state.projectCreatedAt` were mirrored into the state object.

**Rationale:** The same bug also existed in `#save-btn` (the toBlob callback is async), just noticed less often because it was used less — fixed alongside. Both now use the same `openSaveSheet()` fallback, so a consistent UX pattern.

**Impact:** Backup and image save now work reliably in iOS PWA standalone. Architecture lesson for the whole codebase: no `await` may precede any `navigator.share()`. New share/download buttons should always use the modal pattern, which gives a visible recovery path if iOS rejects the first share request after all.

---

## 2026-05-17 — Slider out, preset pills in

**Context:** The `<input type="range">` with the 4 numeric steps 12/24/36/50 forced the user into a number decision with no inherent meaning. Also awkward to hit precisely on touch.

**Decision:** Replaced with five preset cards (Kids/Easy/Standard/Detailed/Fine) with label + color count + hint text. Plus a `minPxFactor` per preset — "Kids" now produces genuinely coarser fields, not just fewer colors (previously: the same fixed threshold in the worker).

**Rationale:** Presets translate the k number into intent ("For kids" instead of "8 colors"). Card selection is easy to hit accurately on touch, communicates the selection more clearly, and makes room for the `hint` text. With the new cap of 8000 px in the worker, Kids presets can genuinely merge large areas even on high-resolution photos.

**Impact:** `state.preset` replaces the slider value, `generateTemplate(k, minPxFactor)` takes both parameters, the worker's `mergeTiny` uses the passed-through factor. Default is "Standard" (24) — deliberately one step lower than the previous default slider value (36), because 24 is the better starting point for most photos.

---

## 2026-05-17 — Text labels under icons for new users

**Context:** Four icon buttons in the paint header with no visible text. Experienced users guess correctly, new users don't know what "eye", "chest", "down arrow" mean — even with a `title=` attribute, since that doesn't appear on touch.

**Decision:** A small `<span class="icon-label">` under each header icon (`Back`, `Template`, `Backup`, `Save`). 10 px, dim color, accent in the active state. The header grows by ~10 px as a result — negligible.

**Rationale:** Simpler than a first-launch tour, no state to manage, works offline, immediately clear to first-time users. Labels stay off in the floating toolbar (Brush/Eraser/Undo) because those icons are more universal there and space is tight.

**Impact:** Header CSS scoped via `.paint-header .icon-btn` and `.prep-header .icon-btn`, so the floating toolbar look stays unchanged.

---

## 2026-05-18 — Print PDF via pdf-lib, loaded on demand

**Context:** The print PDF was the next item in the BACKLOG. Requirement: page 1 numbered template print-ready on A4, page 2 color legend. It has to work on the iPad PWA (standalone mode) — so the iOS share-gesture trap again.

**Decision / Insight:**

1. **pdf-lib via CDN, loaded dynamically** instead of statically in `<head>`. Reason: ~250 KB, most sessions don't need it. The Service Worker only caches same-origin anyway, so static loading would be neither faster nor more offline-stable. The new `loadScript()` helper is idempotent via a `data-loaded-src` attribute.

2. **The PDF path deliberately leaves the sync-gesture pattern.** `PDFDocument.create()` and `embedPng()` are both async — `navigator.share()` can't be called inside the original click gesture. Instead of a hack (e.g. precomputing the PDF on mount): consistently use `openSaveSheet()`. Its modal buttons are themselves fresh gestures that pass the share request under iOS standalone. UX: a "Generating PDF…" toast (60 s) while pdf-lib loads and draws, then a modal with share/open buttons.

3. **A4, orientation-aware.** If `state.height >= state.width` → portrait (595.28 × 841.89 pt), otherwise landscape. The image is centered with `Math.min(availW/imgW, availH/imgH)` scaling, 10 mm margin, plus an 18 pt footer for the project name.

4. **Color legend as a 4-column grid.** Swatch 34×34 pt (≈12 mm), number (11 pt bold) + hex (9 pt) next to it. Fits up to ~36 colors on one A4 page — even the largest preset (Fine = 50) stays just within the page; if too many colors ever come up, a second legend page could be added.

**Rationale:** The print use case (offline painting with pens, giving away the template) doesn't need real-time speed, so the short "Generating" phase is acceptable. More important: no silent failures on iOS, and no 250 KB tax for 99% of sessions.

**Impact:** Three new functions (`loadScript`, `dataURLToUint8Array`, `rgbToHex`) + `exportPDF`. One extra button in the HTML paint header. `sw.js` cache `pbn-v9`. Architecture lesson for future features: when the build path is unavoidably async, don't try to hack share-inside-gesture — `openSaveSheet()` is the clean pattern.

---

## 2026-05-17 — Session pause, backlog for the next session

**Context:** Three open requests (print PDF, fewer-colors preset, nicer detail selection instead of a slider). The session ends here to save conversation tokens.

**Decision:** All three items recorded in structured form in `BACKLOG.md` — with a concrete implementation plan, library recommendation (pdf-lib for PDF), code locations, and acceptance criteria.

**Rationale:** The next session (whichever AI, whenever) can start directly without a warm-up round. The BACKLOG explains not only *what* to do, but also *where in the code* and *what it should concretely look like*.

**Impact:** The next session should start with `README.md` → `BACKLOG.md` → get going. MEMORY.md gets the respective decision added during implementation, CHANGELOG.md gets a new version entry.

---

## 2026-05-21 — v0.9.0 Antigravity merge: SEO, tutorial, print sheet

**Context:** Between the session pause (2026-05-17) and today, I kept working on the project with Antigravity — but in a separate folder `paint-by-numbers-v2`, not in the main repo. The v2 got a complete SEO package, a print-options modal, a tutorial modal, a like button, and a "Past Projects" hero. Today the code goes back into the main project and ships as v0.9.0.

**Decision / Insight:**

1. **Diff analysis first, then merge.** Comparing the two folders showed: only 3 files changed (`index.html`, `manifest.webmanifest`, `sw.js`), 2 new (`robots.txt`, `sitemap.xml`). All Markdown docs (MEMORY, CHANGELOG, BACKLOG, brief, SPEC, README) were bit-identical — Antigravity never touched the docs. Meaning: a trivial drop-in merge.

2. **v1 had 6 staged + 6 unstaged changes that cancelled each other out** (`git diff HEAD` was empty). Cause presumably a botched `git reset HEAD` from an earlier session. Fix: `git reset HEAD -- . && git checkout -- .` — afterward the working tree was clean at HEAD = `fef9960` (0.8.0).

3. **Branch `v0.9.0-antigravity-merge`** instead of directly on main. Rationale: the diff stays visible in git history in case anyone ever asks "when did the SEO block land?". Solo repo, so no PR, just a direct merge to main + tag.

4. **Version jump 0.8.0 → 0.9.0.** No major because no architectural breaks, no patch because clearly new features (SEO, tutorial, print modal). A clean minor release.

5. **First-time setting of git tags.** Before 0.9.0 there were no tags at all in the repo (CHANGELOG.md did track versions, but `git tag` was empty). On push, `v0.8.0` (on `fef9960`) and `v0.9.0` (on the new merge commit) are created retroactively.

**Rationale:** Not discarding the Antigravity work matters, but "different codebases in two folders" is unsustainable long-term. The GitHub repo has to remain the single source of truth. Tags make the version history visible as GitHub Releases — previously only recognizable in CHANGELOG.md.

**Impact:** Going forward, when working with Antigravity (or other agents): work and commit directly in the main folder, not in a parallel folder. If a parallel folder is unavoidable (e.g. experiments that shouldn't go into the repo), use `_experiments/` as a gitignored sibling. The `paint-by-numbers-v2` folder is moved today to `_archive/paint-by-numbers-v2-2026-05-21/`.

---

## 2026-09-21 — Full review, 18 findings, releases 0.9.1 and 0.10.0

**Context:** The project had rested since 0.9.0 (May 2026). A code read plus a live test of the deployed version produced 18 findings (R-01 … R-18), among them: app icons that never existed (which made the atomic `cache.addAll()` fail, so nothing was precached), pointer listeners stacking up per opened project, a start screen that could not scroll on phones, a project list capped at 6, and a hard-coded fake like counter from the 0.9.0 rework.

**Decision / Insight:** All findings were implemented in two steps (0.9.1 quick fixes, 0.10.0 the rest). Notable choices: undo moved from PNG snapshots to dirty rectangles taken from a mirror canvas; k-means fits centroids on a subsample; regions are relabelled after merging so numbering follows what the outlines actually show; the fake like counter and the placeholder donate link were removed rather than backed with a service.

**Rationale:** The dirty-rect undo is synchronous and removes a full PNG encode per stroke. Relabelling is cheaper and more robust than teaching `mergeTiny` to unify same-color neighbours. A fabricated social-proof number on a public, indexed page is misleading, and a real counter would need a backend, which the brief rules out.

**Impact:** Any markup that reaches the DOM from an imported backup must be rebuilt from validated numbers (`importProject`), never inserted as HTML. New files must be added to `FILES` in `sw.js` only if they really exist — one missing file voids the whole precache. Pointer-related changes still need a check on a real iPad (backlog D-01).

---

## 2026-09-21 — Landing page for promotion: example, features, like counter

**Context:** The owner wants to promote the tool. The features were solid but invisible to a first-time visitor: the start screen showed a headline, two buttons and an empty project list. The like button and the coffee link, removed in 0.9.1 because they were fake/placeholder, were wanted back.

**Decision / Insight:** The start screen became a scrolling landing page (hero + before/after slider + feature grid + steps + support card). The example is a procedural scene run through the real pipeline, so the repo carries no third-party image and the "after" picture is honest. Likes use a public hit counter with a fixed offset of 34 chosen by the owner; the coffee URL is a constant still to be filled (backlog L-01).

**Rationale:** A before/after comparison explains the product faster than any copy. A range input as the slider gives drag, tap and keyboard control for free. A real counter avoids the fabricated 12.4k of 0.9.0 while keeping zero backend.

**Impact:** Generating the example exposed a numbering bug (fields joined by a 1 px neck shared one number) — numbering now labels the areas enclosed by the outline mask (`OUTLINE` pseudo color in the worker). Example images are regenerated with `tests/example-assets.playwright.js` whenever the pipeline changes visibly. Every new static file must be added to `FILES` in `sw.js`; a unit test now checks that all of them exist.

---

## 2026-09-21 — Light theme and picture-led feature section

**Context:** Feedback on the 0.11.0 landing page: most people use light mode, the features should be shown as screenshots (e.g. the printable template), the import-backup entry had become a hidden text link, and the how-it-works explanation sat too far down.

**Decision / Insight:** All chrome colors became tokens with a second, white set under `:root[data-theme="light"]`; the theme follows the system unless the user toggles it. Feature pictures are produced from the running app (templates at two levels, paint screen, the real PDF rasterised with `qlmanage`), not mocked. Steps moved under the hero, import became a dashed pill button next to the primary actions.

**Rationale:** Real output is more convincing than icons and keeps the page honest. A dashed outline marks import as a secondary, file-based action without competing with "Choose photo".

**Impact:** New hard-coded colors in CSS break the light theme — use the tokens. After visible pipeline or UI changes rerun `tests/example-assets.playwright.js`, `tests/feature-assets.playwright.js` + `tests/feature-assets.py` and `tests/screenshots.playwright.js`.

