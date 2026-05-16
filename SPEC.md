# Paint-by-Numbers PWA — Kurz-Spec

Stand: 2026-05-16

## Was es ist
Web-App, die im Safari auf dem iPad läuft (PWA, „Zum Home-Bildschirm"). Lädt ein Foto, wandelt es in eine Malen-nach-Zahlen-Vorlage um, bietet einen Mal-Canvas mit Apple-Pencil-Support.

## Modus
**Frei malen** — keine Region-Clipping-Logik, keine Farbprüfung. Die Vorlage (schwarze Konturen + Zahlen) liegt als halbtransparenter Layer über dem Mal-Canvas. Nutzer wählt eine Farbe aus der nummerierten Palette, malt mit dem Pencil drüber. Vorlage ein-/ausblendbar.

## Screens
1. **Start** — „Foto wählen" (öffnet iOS-Picker)
2. **Vorbereitung** — Bild-Preview + Detailgrad-Slider (12 / 24 / 36 / 50 Farben), „Vorlage erzeugen"
3. **Malen** — Fullscreen-Canvas, Palette unten, Toolbar oben (Pinsel/Radiergummi/Zoom/Vorlage-Toggle/Speichern)

## Pipeline (im Web Worker)
1. Bild auf max. 2000 px skalieren
2. Bilateraler Filter (Rauschen weg, Kanten bleiben)
3. K-Means im LAB-Farbraum → Palette + ID-Map
4. Median-Filter auf ID-Map
5. Connected-Components → Regionen
6. Mini-Regionen (<120 px) in Nachbarn mergen
7. Konturen via Marching-Squares + Douglas-Peucker
8. Zahlenposition: Pole-of-Inaccessibility pro Region
9. Output: SVG-String + Palette-JSON

## Speicher
IndexedDB. Pro Projekt: Original-Bild, SVG-Vorlage, Palette, Mal-Canvas-Bitmap. „Fortsetzen"-Liste auf Start-Screen.

## Stack
Vanilla HTML + CSS + JS, ein einziger Web Worker für die Pipeline. Keine externen Libs nötig (alle Algorithmen handgeschrieben). PWA-Manifest + Service Worker für Offline.

## Design
Aus `antigravity-portfolio-prompt.md`:
- Hintergrund Deep Black `#0A0A0A`
- Akzent Warm Orange `#E8651A`
- Sekundär Warm Brown `#3D2B1A`
- Serif Headlines, Sans-Serif Body
- Mal-Canvas-Fläche bleibt neutral hellgrau (`#EEEEEE`)

Tonalität aus `stimmen-profil.md`: kurz, direkt, kein Corporate-Sprech.

## Pencil
PointerEvents API. `pointerType === 'pen'` aktiviert druck- und neigungssensible Striche. Default-Pinsel: weicher Rundpinsel, Größe 8–30 px je nach Druck.

## Out of Scope (erste Version)
- Region-Clipping
- Farbprüfung / Fortschrittsmessung
- Cloud-Sync
- Druck-Export
