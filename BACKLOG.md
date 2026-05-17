# BACKLOG.md — Paint by Numbers PWA

> Was als Nächstes ansteht. Jeder Eintrag enthält Skizze + Ort im Code, damit man direkt loslegen kann.
> Format: `## [Status] Titel` — Status ist `Next`, `Later`, `Idea`.

---

## [Next] Druck-PDF der Vorlage

**Was:** Button im Paint-Header (Drucker-Icon, links neben „Save image") oder als zusätzliche Aktion im Backup-Button-Menü → erzeugt eine druckfertige PDF mit (1) der nummerierten Schwarz-Weiß-Vorlage bildschirmfüllend auf A4 / Letter, plus (2) einer Farb-Legende-Seite mit Nummer ↔ Farbe ↔ Hex.

**Warum:** Offline malen mit echten Stiften auf Papier, oder zum Verschenken einer fertigen Vorlage.

**Wie (kompakt):**

1. **PDF-Library wählen:** [`pdf-lib`](https://github.com/Hopding/pdf-lib) (~250 KB, läuft komplett im Browser, kein Server). Per CDN laden:
   ```html
   <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>
   ```
2. **Seite 1 — Vorlage:**
   - PDF im A4 quer/hoch je nach Bild-Aspect (`Math.max(w/h, h/w)` entscheiden lassen)
   - `state.templateBitmap` als PNG einbetten (`pdfDoc.embedPng(...)`), so groß wie möglich auf der Seite, zentriert, 10 mm Rand
3. **Seite 2 — Farb-Legende:**
   - Header: „Color guide — <projektname>"
   - Grid 4 Spalten × n Zeilen: jedes Feld ist farbiges 12×12 mm Quadrat + Nummer + Hex
   - Schriftgrad 9 pt, Helvetica
4. **Download:** `pdfDoc.save()` → Uint8Array → Blob → gleicher Web-Share-/Download-Pfad wie beim Backup
5. **State-Check:** vor dem Generieren `state.templateBitmap && state.palette.length > 0`

**Wo im Code:**
- HTML: neuen Button in `<div class="paint-header">` mit Drucker-SVG
- JS: neue Funktion `async function exportPDF() { ... }`, Event-Listener wie `backupProject`
- Größere Hinzufügung: `<script src="...pdf-lib.min.js">` im `<head>` (oder dynamisch per `loadScript()` damit der Offline-Modus nicht bricht)
- `sw.js`: pdf-lib CDN-URL in FILES-Array? Nein — CDN ist Cross-Origin und unser SW ignoriert das. PDF-Export verlangt online — kein Problem für den Druck-Use-Case.

**Edge Cases:**
- Großes Bild → PDF-Größe checken (PNG-Einbettung ist verlustfrei, 2000×2000 wird ~3 MB)
- Wenn `navigator.share` fehlt: klassischer `<a download>`-Fallback

**Akzeptanzkriterium:** Auf iPad öffnet sich nach Tap das iOS-Sharesheet mit einer `<projekt>.pdf`, in der Seite 1 die Vorlage und Seite 2 die Legende zeigt.

---

## [Next] „Weniger Farben"-Preset

**Was:** Schnellauswahl auf dem Prep-Screen für die typischen Use-Cases. Beispiele:
- „Kids" — 8 Farben, große Felder
- „Easy" — 16 Farben
- „Standard" — 24 Farben (heute Default)
- „Detailed" — 36 Farben
- „Fine" — 50 Farben

**Warum:** Der Schieber zwingt zu einer numerischen Entscheidung, ohne dass klar ist was das bedeutet. Presets übersetzen das in Intent.

**Wie (kompakt):**

1. Aus dem `DETAIL_OPTIONS = [12, 24, 36, 50]` Array eine reichere Liste machen:
   ```js
   const PRESETS = [
     { id: 'kids',     label: 'Kids',     k: 8,  minPxFactor: 0.0015 },
     { id: 'easy',     label: 'Easy',     k: 16, minPxFactor: 0.0008 },
     { id: 'standard', label: 'Standard', k: 24, minPxFactor: 0.0004 },
     { id: 'detailed', label: 'Detailed', k: 36, minPxFactor: 0.00025 },
     { id: 'fine',     label: 'Fine',     k: 50, minPxFactor: 0.00015 },
   ];
   ```
2. `minPxFactor` ans Worker-`mergeTiny` durchreichen, damit „Kids" auch größere Felder hat (sonst nur weniger Farben aber gleich kleine Felder).
3. State trägt aktuellen Preset-Index, nicht mehr nur Detail-Slider-Value.

**Wo im Code:**
- HTML: `.controls` Block ersetzt den Slider durch eine Preset-Auswahl (siehe nächster Punkt)
- JS: `state.preset = 'standard'`, beim Generate-Click den passenden Preset rausziehen
- Worker: `mergeTiny` bekommt `minPx` von außen (ist schon so, parameter durchgereicht)

**Akzeptanzkriterium:** Preset „Kids" liefert sichtbar gröbere, kindgerechtere Vorlagen; Preset „Fine" feinere als bisherige Default-36.

---

## [Next] Schöneres UI für die Farbauswahl

**Was:** Der `<input type="range">` Slider durch eine Preset-Auswahl im Card- oder Pill-Stil ersetzen.

**Warum:** Slider ist auf Touch unangenehm präzise zu treffen, und die Zahlen unter dem Slider („12 / 24 / 36 / 50") sehen aus wie ein Tachometer. Cards sind angemessener.

**Wie (kompakt — visueller Vorschlag):**

```
┌──────────────────────────────────────────────────────────┐
│ Detail level                                             │
├──────────────────────────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │Kids │  │Easy │  │Stand│  │Detai│  │Fine │             │
│  │  8  │  │ 16  │  │ 24  │  │ 36  │  │ 50  │             │
│  └─────┘  └──┃──┘  └─────┘  └─────┘  └─────┘             │
│             ┃                                            │
│       active (orange border)                             │
└──────────────────────────────────────────────────────────┘
```

- Horizontale Scrollable-Liste falls 5 Cards auf schmaleren Screens nicht passen
- Card: 72×72 px, Border `var(--border)`, aktive Card hat `border: 2px solid var(--accent)` + leichter Glow `box-shadow: 0 0 0 4px var(--accent-soft)`
- Beschriftung: Label oben (`font-size:13px, font-weight:500`), Zahl unten klein (`font-size:11px, color:var(--text-mute)`)

**Wo im Code:**
- HTML: ersetze `<input type="range" id="detail-slider">` durch
  ```html
  <div class="preset-pills" id="preset-pills">
    <!-- befüllt per JS aus PRESETS -->
  </div>
  ```
- CSS: neuer `.preset-pills` Style (flex, gap:8px, overflow-x:auto)
- JS: `function renderPresetPills()` baut die Cards, `state.preset` wird beim Tap gesetzt

**Akzeptanzkriterium:** Anstatt eines Sliders sieht man 5 Cards nebeneinander. Tap auf eine setzt sie als aktiv (orange Border). „Generate template" nimmt den aktiven Preset.

---

## [Later] Nice-to-haves

- Pinselformen-Auswahl (rund / abgerundet-eckig / breit)
- Hover-Indikator für Pencil-Geräte (zeigt schon vor dem Aufsetzen wo der Strich landen würde)
- Mehrere offene Projekte parallel sichtbar als Gallery (statt nur Liste)
- Export ins iOS Foto-Album direkt (über `navigator.share` mit Bild-File)
- „Schnell-Färbung": Tap auf Region füllt die ganze Region mit der aktiven Farbe (Opt-in, weil das die „frei malen"-Philosophie aufweicht)
- Mehrsprachiges UI (deutsch / englisch) — heute komplett englisch

## [Idea] Eventuell, je nach Bedarf

- WebRTC-Sync mehrerer iPads (zwei Personen malen am selben Bild)
- AI-Beratung „diese Farbe passt jetzt" (lokal über onnxruntime-web, klein gehaltenes Modell)
- Schwierigkeitsanalyse („dieses Bild hat sehr viele kleine Regionen, willst du erst Easy-Preset probieren?")
