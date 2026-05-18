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
4. **Download:** `pdfDoc.save()` → Uint8Array → Blob → **denselben `openSaveSheet()`-Pfad wie Backup und Save** (also `navigator.share()` synchron im Click + Modal-Fallback). Wichtig: `pdfDoc.save()` ist async — also entweder vor dem User-Klick prefetchen, oder den Klick-Handler mit dem schon-existierenden Sync-Pattern bauen (Blob synchron vorbereiten wenn möglich).
5. **State-Check:** vor dem Generieren `state.templateBitmap && state.palette.length > 0` (`backupProject` macht das auch schon so)

**Wo im Code:**
- HTML: neuen Button in `<div class="paint-header">` mit Drucker-SVG + `<span class="icon-label">Print</span>`
- JS: neue Funktion `async function exportPDF() { ... }`, Event-Listener wie `backupProject`
- Größere Hinzufügung: `<script src="...pdf-lib.min.js">` im `<head>` (oder dynamisch per `loadScript()` damit der Offline-Modus nicht bricht — Empfehlung: dynamisch laden, weil pdf-lib ~250 KB ist und die meisten Sessions ihn nicht brauchen)
- `sw.js`: pdf-lib CDN-URL in FILES-Array? Nein — CDN ist Cross-Origin und unser SW ignoriert das. PDF-Export verlangt online — kein Problem für den Druck-Use-Case.

**Edge Cases:**
- Großes Bild → PDF-Größe checken (PNG-Einbettung ist verlustfrei, 2000×2000 wird ~3 MB)
- pdf-lib `save()` ist async — vorbereitendes Blob-Bauen passt nicht ins Sync-Gesture-Pattern. Lösung: Klick öffnet sofort eine Mini-„Generating PDF…"-Toast und das Modal erst nach Promise-Resolve.

**Akzeptanzkriterium:** Auf iPad öffnet sich nach Tap das iOS-Sharesheet (oder als Fallback das `openSaveSheet()`) mit einer `<projekt>.pdf`, in der Seite 1 die Vorlage und Seite 2 die Legende zeigt.

---

## [Later] Nice-to-haves

- Pinselformen-Auswahl (rund / abgerundet-eckig / breit)
- Hover-Indikator für Pencil-Geräte (zeigt schon vor dem Aufsetzen wo der Strich landen würde)
- Mehrere offene Projekte parallel sichtbar als Gallery (statt nur Liste)
- Export ins iOS Foto-Album direkt (über `navigator.share` mit Bild-File — funktioniert seit dem 0.7.0-Fix korrekt)
- „Schnell-Färbung": Tap auf Region füllt die ganze Region mit der aktiven Farbe (Opt-in, weil das die „frei malen"-Philosophie aufweicht)
- Mehrsprachiges UI (deutsch / englisch) — heute komplett englisch
- Icon-Labels auch im Floating-Toolbar (Brush/Eraser/Undo) — wurde in 0.7.0 bewusst weggelassen, aber falls neue User auch dort stocken, nachziehen
- First-Launch-Mini-Tour (Bubble-Highlights für jedes Tool nach erstem Projekt) — falls die statischen Labels nicht reichen

## [Idea] Eventuell, je nach Bedarf

- WebRTC-Sync mehrerer iPads (zwei Personen malen am selben Bild)
- AI-Beratung „diese Farbe passt jetzt" (lokal über onnxruntime-web, klein gehaltenes Modell)
- Schwierigkeitsanalyse („dieses Bild hat sehr viele kleine Regionen, willst du erst Easy-Preset probieren?")

---

## Erledigt in 0.7.0

- ✅ ~~„Weniger Farben"-Preset~~ — fünf Presets statt Slider, mit `minPxFactor` für Kids-gerechte Feldgrößen
- ✅ ~~Schöneres UI für die Farbauswahl~~ — Slider durch Preset-Pills ersetzt
