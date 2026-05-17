# Project Brief: Paint by Numbers PWA

## Project Overview

- **Name:** paint-by-numbers-pwa
- **Type:** Tool (Web-App / PWA)
- **Status:** In Progress
- **Start Date:** 2026-05-16
- **Target Date:** offen
- **Repo:** [github.com/dynamicdolphino/paint-by-numbers-pwa](https://github.com/dynamicdolphino/paint-by-numbers-pwa) (public, wegen GitHub Pages)
- **Live URL:** [dynamicdolphino.github.io/paint-by-numbers-pwa/](https://dynamicdolphino.github.io/paint-by-numbers-pwa/)

## Problem

Es gibt zwar Malen-nach-Zahlen-Apps für iPad, aber keine, die aus einem **eigenen Foto** sofort eine Vorlage erzeugt, ohne dass man Daten an einen fremden Anbieter hochladen muss. Außerdem will Michael nicht für jede neue Idee eine zusätzliche App installieren.

## Solution

Eine Single-File-Web-App, die im Safari auf dem iPad läuft und alles lokal macht: Foto rein, k-Means-Quantisierung im Browser, Konturen + Nummern aufs Bild, Mal-Canvas mit Apple-Pencil-Support. „Zum Home-Bildschirm" macht daraus eine echte App ohne App-Store-Umweg.

## Target Audience

Erstmal Michael selbst. Weil das Repo public ist, kann jeder es nutzen — aber nicht der primäre Use Case.

## Success Criteria

- [x] Aus einem iPad-Foto wird eine nummerierte Mal-Vorlage erzeugt
- [x] Mit Pencil malbar, mit Touch zoom-/pan-bar
- [x] Auto-Save in IndexedDB, Projekt-Liste auf Start-Screen
- [x] Backup-Export als `.pbn.json`, Import zur Wiederherstellung
- [x] Undo (10 Schritte)
- [x] Live über GitHub Pages erreichbar, PWA-installierbar
- [ ] Nice-to-have: Druck-Export der reinen Vorlage als PDF
- [ ] Nice-to-have: mehrere Pinselformen, härtere Pencil-Druckstufen

## Tech Stack / Tools

- HTML + CSS + Vanilla JavaScript (eine `index.html` mit allem inline)
- Web Worker für die Bildverarbeitung (k-Means in LAB, Connected-Components, Marching-Squares-ähnliche Edge-Extraktion, Inscribed-Circle für Zahlen-Positionen)
- IndexedDB für Projekt-Persistenz, `navigator.storage.persist()` gegen Eviction
- Service Worker für Offline + Cache-Versionierung
- PointerEvents API für Pencil-Druck + Pinch/Zoom
- `navigator.share()` für Backup-Export (iOS-PWA-tauglich), Fallback auf `<a download>`

## Anti-Goals

- Kein Cloud-Sync, keine Konten, kein Server (Privacy-Default)
- Kein Region-Clipping beim Malen (User wollte frei malen können)
- Keine zusätzlichen Libraries — alles handgeschrieben für saubere `git diff`s

## References & Inspiration

- Klassische Paint-by-Numbers-Apps (Pigment, Recolor) — als Funktionsspiegel, nicht als Codebasis
- antigravity-portfolio-prompt.md im Workspace für die Farbpalette des UI
- stimmen-profil.md für die UX-Texte
