# CHANGELOG

Alle nennenswerten Änderungen am Projekt.
Format folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).
Neueste Einträge **oben**.

---

## [0.7.0] — 2026-05-17 — iOS-Backup-Fix + Detail-Presets + Discoverability

### Added
- `PRESETS` mit fünf Detail-Stufen: Kids (8 / sehr grobe Felder), Easy (16), Standard (24), Detailed (36), Fine (50 Farben)
- Preset-Pill-Auswahl im Prep-Screen (Cards mit Label + Farbenzahl + Hinweis) — ersetzt den alten Slider
- `minPxFactor` pro Preset, an den Worker durchgereicht — „Kids" liefert jetzt wirklich gröbere Felder, nicht nur weniger Farben
- Text-Labels unter allen Header-Icons (`Back`, `Template`, `Backup`, `Save`) — neue User wissen sofort was die Buttons tun
- Generisches `openSaveSheet()` Modal als sichtbarer Fallback wenn `navigator.share()` rejected oder fehlt
- Synchron-Helfer `dataURLToBlobSync()` und `templateCanvasFromState()`

### Changed
- `state` um `projectName`, `projectCreatedAt`, `preset` erweitert (damit Backup synchron ohne `dbGet()` läuft)
- `backupProject()` baut JSON-Payload jetzt komplett synchron aus `state.*` und ruft `navigator.share()` **vor** allen `await`s auf
- `#save-btn` nutzt das gleiche Sync-Pattern (vorher `toBlob`-Async-Callback + stilles `<a download>`)
- Worker-Threshold für `mergeTiny`: Cap erhöht von 200 px auf 8000 px, damit grobe Presets nicht abgeklemmt werden
- `sw.js` — Cache `pbn-v8`

### Fixed
- **Backup-Speichern auf iOS-PWA: Klick passierte sichtbar nichts.** Ursache war Gesture-Token-Verlust durch `await`s vor `navigator.share()`; iOS-Safari rejected dann silent und der `<a download>`-Fallback wird im Standalone-Modus ignoriert
- Save-Image-Button hatte denselben iOS-Bug (toBlob-Callback) — jetzt auch synchron
- Backup-Modal-Listener-Leak bei wiederholtem Öffnen ohne Schließen
- Object-URL wurde im Fallback zu früh revoked, bevor der `<a download>`-Fetch durch war
- `importProject` gab bei kaputter JSON-Datei kryptischen `SyntaxError` statt User-freundlicher Meldung

### Removed
- `DETAIL_OPTIONS` Array, `#detail-slider`, `#detail-value`
- Toter Code `blobToBase64()` (Backup nutzt jetzt synchrone Pfade)

---

## [0.6.0] — 2026-05-16 — Projekt-Dokumentation + Dateiname-Fix

### Added
- `brief.md` — Projekt-Brief nach AI-SYSTEM-Template
- `MEMORY.md` — Chronologisches Logbuch mit Entscheidungen + Begründungen
- `CHANGELOG.md` — diese Datei
- `formatProjectStamp()` — neuer Projektname enthält Datum + Stunden:Minuten

### Changed
- `index.html` — Projektname-Format von `'Project ' + toLocaleDateString` zu `'Project YYYY-MM-DD HH:MM'`
- `sw.js` — Cache `pbn-v7` (von v6)

### Fixed
- Mehrere Projekte am gleichen Tag hatten gleichen Anzeigenamen und Backup-Dateinamen

---

## [0.5.0] — 2026-05-16 — Backup über Web Share + Race-Fix

### Added
- Prominentes „Import backup" als sekundärer Button auf dem Start-Screen
- `flushSave()` — synchroner Save-Flush beim Verlassen des Mal-Screens

### Changed
- Backup-Button nutzt jetzt `navigator.share()` mit File-Anhang (öffnet iOS-Sharesheet); Fallback auf klassischen Download für Desktop
- `resumeProject()` fängt Fehler ab und gibt Toast statt stiller Hänger
- `sw.js` — Cache `pbn-v6`

### Fixed
- Backup-Speichern auf iOS-PWA funktionierte nicht (`<a download>` wird im Standalone-Modus ignoriert)
- Race-Condition: „Zurück" → sofort „Open" → unvollständiger Blob → Projekt nicht öffenbar
- „or import a project backup" war zu unscheinbar (jetzt eigener Button)

---

## [0.4.0] — 2026-05-16 — Undo + Backup-Export/Import + Zoom-Fix

### Added
- Undo-Stack (10 Schritte, PNG-Blobs)
- Undo-Button in der schwebenden Toolbar (zwischen Eraser und Brush-Slider)
- Backup-Export als `.pbn.json` (Original + Vorlage + Palette + Mal-Stand)
- Backup-Import auf Start-Screen
- `pushUndo()` Snapshot vor jedem Stroke-Beginn
- Toolbar `touch-action: manipulation` und pointer-Event-Isolation

### Changed
- `fitCanvas()` läuft jetzt nach `go('paint')` via `requestAnimationFrame`
- Touch-Strokes starten erst beim ersten `pointermove`, Pen-Strokes sofort
- `sw.js` — Cache `pbn-v5`

### Fixed
- Beim ersten Öffnen war das Bild zu groß und musste manuell rausgezoomt werden
- Brush-Slider und Toolbar-Buttons lösten Mini-Striche auf der Canvas aus
- 2-Finger-Zoom hinterließ Mini-Klecks an der Startposition des ersten Fingers

---

## [0.3.0] — 2026-05-16 — Detail, Zahlen-Layout, Picker, Persistenz

### Added
- Inscribed-Circle-Berechnung (`innerPoint`) für Zahlen-Positionen — Zahl liegt garantiert in der Region
- Dynamischer `mergeTiny`-Threshold (~0.04% der Bildgröße) statt fixer 120 px
- `navigator.storage.persist()` für eviction-resistente IndexedDB
- Service Worker nutzt network-first für Navigationen — neue App-Versionen werden ohne manuelles Cache-Leeren ausgespielt

### Changed
- Default-Detailgrad: 36 Farben (vorher 24)
- Maximale Bildauflösung: 2000 px Längsseite (vorher 1600)
- Zahlen-Schriftgröße jetzt hart auf 22 px gecappt
- `sw.js` — Cache `pbn-v3` / `pbn-v4`

### Fixed
- Foto-Picker zeigte auf iPad nur die Kamera (Bug: `capture="environment"` auf dem File-Input)
- Zahlen waren bei großen Regionen riesig und überlagerten benachbarte Zahlen
- Zu wenige Felder bei detailreichen Fotos

---

## [0.2.0] — 2026-05-16 — Canvas-Layout-Fix + komplette englische UI

### Added
- Wrapper-Div `.canvas-stack` für Canvas-Stapel
- Apple-Mobile-Web-App Meta-Tags
- Englische UI (statt deutsch — explizite User-Anforderung)

### Changed
- Stage als Flex-Container mit `align-items: center; justify-content: center`
- Transform liegt jetzt auf `.canvas-stack`, nicht auf jeder Canvas einzeln
- Alle User-sichtbaren Strings übersetzt (Buttons, Toasts, Datumsformatierung, Manifest)

### Fixed
- Canvas war nach Vorlagen-Erzeugung leer (Layout-Bug: `transform: translate(-50%, -50%) scale(...)` rechnete bei großen Canvas falsch)

---

## [0.1.0] — 2026-05-16 — Erste Version, GitHub Pages live

### Added
- `index.html` — komplette App in einer Datei (HTML + CSS + Main-JS + Worker-Source)
- `sw.js` — Service Worker für Offline
- `manifest.webmanifest` — PWA-Manifest
- `SPEC.md` — Technische Spezifikation
- `README.md` — Repo-Übersicht (englisch, da public)
- `LICENSE` — MIT
- Pipeline: k-Means in LAB → Median-Filter → Connected-Components → Mini-Region-Merge → Edge-Extraktion → Nummerierung
- Mal-Canvas mit Apple-Pencil-Support (PointerEvents, Druck, Tilt)
- IndexedDB-Projekt-Persistenz, Auto-Save nach jedem Stroke (debounced)
- Foto-Import via iOS-Picker
- GitHub-Repo `dynamicdolphino/paint-by-numbers-pwa` (public, wegen Pages)
- GitHub Pages live unter `dynamicdolphino.github.io/paint-by-numbers-pwa/`

### Decisions
- **Web-App statt nativer iPad-App** — kein Mac/Xcode/Apple-Account nötig
- **„Frei malen" statt Region-Clipping** — größere Mal-Freiheit, einfachere Implementation
- **Vanilla JS ohne Frameworks** — kleinere Bundles, einfacher zu auditieren
- **GitHub Pages als Hoster** — kostenlos, automatischer Deploy bei jedem Push auf `main`
