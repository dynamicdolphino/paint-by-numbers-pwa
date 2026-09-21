# Project Brief: Paint by Numbers PWA

## Project Overview

- **Name:** paint-by-numbers-pwa
- **Type:** Tool (web app / PWA)
- **Status:** In Progress
- **Start Date:** 2026-05-16
- **Target Date:** open
- **Repo:** [github.com/dynamicdolphino/paint-by-numbers-pwa](https://github.com/dynamicdolphino/paint-by-numbers-pwa) (public, for GitHub Pages)
- **Live URL:** [dynamicdolphino.github.io/paint-by-numbers-pwa/](https://dynamicdolphino.github.io/paint-by-numbers-pwa/)

## Problem

There are paint-by-numbers apps for iPad, but none that instantly turns your **own photo** into a template without uploading data to a third-party provider. Michael also doesn't want to install a separate app for every new idea.

## Solution

A single-file web app that runs in Safari on the iPad and does everything locally: photo in, k-means quantization in the browser, outlines + numbers drawn onto the image, paint canvas with Apple Pencil support. "Add to Home Screen" turns it into a real app without an App Store detour.

## Target Audience

Primarily Michael himself. Since the repo is public, anyone can use it — but that's not the primary use case.

## Success Criteria

- [x] A numbered paint template is generated from an iPad photo
- [x] Paintable with Pencil, zoomable/pannable with touch
- [x] Auto-save to IndexedDB, project list on the start screen
- [x] Backup export as `.pbn.json`, import for restoring
- [x] Undo (10 steps)
- [x] Live via GitHub Pages, installable as a PWA
- [x] Nice-to-have: print export of the plain template as a PDF
- [ ] Nice-to-have: multiple brush shapes, finer pencil-pressure levels

## Tech Stack / Tools

- HTML + CSS + vanilla JavaScript (a single `index.html` with everything inline)
- Web Worker for image processing (k-means in LAB, connected components, raster edge-mask outline extraction, inscribed-circle number placement)
- IndexedDB for project persistence, `navigator.storage.persist()` against eviction
- Service Worker for offline support + cache versioning
- PointerEvents API for pencil pressure + pinch/zoom
- `navigator.share()` for backup export (iOS-PWA-capable), falling back to `<a download>`

## Anti-Goals

- No cloud sync, no accounts, no server (privacy by default)
- No region clipping while painting (the user wanted to paint freely)
- No additional libraries beyond one deliberate exception: pdf-lib, loaded on demand only for PDF export — everything else is hand-written for clean `git diff`s

## References & Inspiration

- Classic paint-by-numbers apps (Pigment, Recolor) — as a feature mirror, not as a code base
- antigravity-portfolio-prompt.md in the workspace for the UI color palette
- stimmen-profil.md for the UX copy
