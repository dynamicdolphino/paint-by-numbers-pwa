# BACKLOG.md — Paint by Numbers PWA

> Was als Nächstes ansteht. Jeder Eintrag enthält Skizze + Ort im Code, damit man direkt loslegen kann.
> Format: `## [Status] Titel` — Status ist `Next`, `Later`, `Idea`.

---

## [Next] SRI-Hash für pdf-lib CDN-Load

**Was:** Beim dynamischen Load von `pdf-lib.min.js` einen `integrity`-Hash setzen, damit ein kompromittiertes cdnjs nicht beliebigen JS-Code einschleusen kann.

**Wie:**

1. Hash lokal berechnen (cdnjs blockt im Sandbox-Egress):
   ```bash
   curl -sS https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js \
     | openssl dgst -sha384 -binary | openssl base64 -A
   ```
2. Im Code (Zeile mit `await loadScript(PDF_LIB_CDN);`) den Hash als zweites Argument durchreichen:
   ```js
   await loadScript(PDF_LIB_CDN, 'sha384-<HASH>');
   ```
3. `loadScript()` setzt bereits `crossOrigin = 'anonymous'`, daher klappt die Browser-seitige Integrity-Prüfung sobald der Hash gesetzt ist.

**Warum:** Ohne SRI würde eine cdnjs-Kompromittierung beliebiges JS in der PWA ausführen lassen — inklusive Zugriff auf IndexedDB (gespeicherte Bilder + Backups). Mit SRI wird der `<script>`-Tag still abgelehnt, wenn der Hash nicht passt.

**Akzeptanzkriterium:** Im DevTools-Network-Tab steht „Integrity check passed" bei der pdf-lib-Anfrage; bei manipuliertem Inhalt wird das Script blockiert.

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

## Erledigt in 0.8.0

- ✅ ~~Druck-PDF der Vorlage~~ — pdf-lib via CDN (on-demand), Print-Button im Paint-Header, A4 mit Vorlage + Farb-Legende
- ✅ ~~loadScript() Helper~~ — generischer on-demand-Loader für künftige optionale Libraries

## Erledigt in 0.7.0

- ✅ ~~„Weniger Farben"-Preset~~ — fünf Presets statt Slider, mit `minPxFactor` für Kids-gerechte Feldgrößen
- ✅ ~~Schöneres UI für die Farbauswahl~~ — Slider durch Preset-Pills ersetzt
