# Paint by Numbers — iPad PWA

Eine Web-App, die aus einem beliebigen Foto eine Malen-nach-Zahlen-Vorlage erzeugt und dir einen Mal-Canvas mit Apple-Pencil-Support gibt. Läuft als Progressive Web App im Safari — keine App-Installation, kein App Store.

## Was sie macht

1. Foto auswählen (Fotomediathek, Dateien oder Kamera)
2. Detailgrad wählen (12 / 24 / 36 / 50 Farben)
3. App wandelt das Bild in eine Vorlage um — schwarze Konturen, nummerierte Felder, dazu eine passende Farbpalette
4. Mit dem Apple Pencil drüber malen — frei, ohne Region-Clipping

Alles passiert lokal im Browser. Kein Server, kein Upload. Zwischenstände werden in IndexedDB gesichert, fertige Bilder als PNG exportiert.

## Stack

- Vanilla HTML / CSS / JavaScript — keine externen Libraries
- Web Worker für die Bildverarbeitung (k-Means in LAB, Connected-Components, Median-Smoothing, Edge-Extraktion)
- PointerEvents API für Pencil-Druck und -Neigung
- Service Worker für Offline-Betrieb
- IndexedDB für Projekt-Persistenz

## Verwendung

Live: `https://dynamicdolphino.github.io/paint-by-numbers-pwa/`

Auf dem iPad im Safari öffnen, Teilen-Symbol → „Zum Home-Bildschirm".

## Lokal entwickeln

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Struktur

```
paint-by-numbers-pwa/
├── index.html              # Komplette App (HTML + CSS + Main-JS + Worker-Source)
├── sw.js                   # Service Worker für Offline
├── manifest.webmanifest    # PWA-Manifest
├── SPEC.md                 # Technische Spezifikation
└── README.md
```

## Lizenz

MIT — siehe `LICENSE`.
