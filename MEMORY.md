# MEMORY.md — Paint by Numbers PWA

> Chronologisches Logbuch des Projekts.
> Neuere Einträge unten — entlang der Implementierungsreihenfolge.

**Format pro Eintrag:**

```
## YYYY-MM-DD — Kurztitel
**Kontext:** Situation
**Entscheidung / Erkenntnis:** Was
**Begründung:** Warum
**Auswirkung:** Konsequenz für künftige Arbeit
```

---

## 2026-05-16 — Web-App statt nativ

**Kontext:** Michael wollte eine Malen-nach-Zahlen-Lösung für iPad + Apple Pencil aus eigenen Fotos, ohne fremde App und ohne sich Xcode-/Mac-Setup zumuten zu wollen.

**Entscheidung:** Single-File-PWA (HTML/CSS/JS) statt nativer Swift-App. Hosting über GitHub Pages.

**Begründung:** Kein Mac mit Xcode nötig, kein Apple Developer Account ($99/Jahr), keine 7-Tage-Re-Sign-Pflicht. Pencil-Support über PointerEvents API ist seit iPadOS 13.4 stabil. Wenn jemals Performance-/Hover-Features fehlen, ist der Sprung zu nativ später möglich, weil die Vorlagen-Logik (SVG / JSON-Palette) portabel bleibt.

**Auswirkung:** Repo muss public sein (Pages auf Free-Tier braucht public). Service Worker + IndexedDB für Offline-Persistenz statt App-Store-Lokalspeicher.

---

## 2026-05-16 — „Frei malen" statt Region-Clipping

**Kontext:** Drei Verhaltens-Optionen für die Pencil-Striche: (1) strikt — Strich nur in passender Region, (2) mild — alle Striche werden gezeichnet, Region zählt nur als „fertig" wenn richtige Farbe dominiert, (3) frei — Vorlage ist nur Hilfe.

**Entscheidung:** Option 3 (frei malen).

**Begründung:** Größere Mal-Freiheit, deutlich einfachere Implementation (kein Per-Region-Clipping, keine Echtzeit-Farbprüfung), näher an „echtem" Malen. Wenn der User-Wunsch nach Strenge irgendwann kommt, kann das später als Switch ergänzt werden.

**Auswirkung:** Vorlage ist ein einziger Bildlayer mit Linien + Zahlen über dem Mal-Canvas, kein per-Region-Mask-System.

---

## 2026-05-16 — k-Means in LAB statt RGB

**Kontext:** Farbquantisierung muss perzeptuell passen, sonst clustert es z.B. Himmel und Hauttöne falsch zusammen.

**Entscheidung:** k-Means im CIE-LAB-Farbraum, k++ Initialisierung, 12 Lloyd-Iterationen.

**Begründung:** LAB-Distanzen entsprechen viel besser dem menschlichen Farbempfinden als RGB. k++ verhindert die häufigste Klasse von schlechten Cluster-Initialisierungen.

**Auswirkung:** Pipeline-Schritt 1. Output ist eine ID-Map (pro Pixel: Cluster-Index) plus eine RGB-Palette (Mittelwert pro Cluster im Originalfarbraum).

---

## 2026-05-16 — Zahl-Positionierung über Inscribed Circle

**Kontext:** Erste Implementierung setzte Zahlen ins bbox-Zentrum jeder Region. Bei konkaven (L-förmigen) oder schmalen Regionen landeten Zahlen außerhalb des sichtbaren Felds. Außerdem skalierte die Schriftgröße mit der Bounding-Box, was bei großen Regionen riesige Zahlen ergab, die andere überlagerten.

**Entscheidung:** Pro Region wird der inscribed-circle-Mittelpunkt approximativ ermittelt (Distance-to-edge in 4 Achsen, gesampled auf einem dichten Grid). Schriftgröße = `clamp(9, 22, radius * 1.05)`.

**Begründung:** Position liegt garantiert innerhalb der Region (egal welche Form). Schriftgröße ist nach oben gecappt, sodass keine Zahl visuell andere überlagert.

**Auswirkung:** Code in `makeNumbering` + `innerPoint`. Verifiziert mit synthetischem L-Test (Zahl liegt im L-Schenkel statt im leeren bbox-Mittel).

---

## 2026-05-16 — Touch-Strokes deferred, Pen sofort

**Kontext:** Beim 2-Finger-Zoom zeichnete der erste Finger einen Mini-Klecks, bevor die App den zweiten Pointer als Pinch erkannte. Bei Toolbar-Slidern (Pinselgröße) lief der pointerdown durch zur Canvas.

**Entscheidung:** Pen-Strokes starten sofort. Touch-/Maus-Strokes warten auf den ersten `pointermove`-Event — ohne Bewegung kein Punkt. Toolbar-Container fängt eigene pointerdowns ab (early return im Canvas-Handler).

**Begründung:** Pencil hat per Definition Mal-Intent (kein „Aus Versehen aufgesetzt"). Touch dagegen ist mehrdeutig — erst eine echte Bewegung signalisiert Mal-Intent.

**Auswirkung:** Klecks-freier Zoom-Start. Slider funktionieren ohne Strich-Artefakte.

---

## 2026-05-16 — Backup via Web Share API

**Kontext:** iOS Safari im PWA-Standalone-Modus ignoriert `<a download>` — Backup wurde gar nicht gespeichert.

**Entscheidung:** Primärer Pfad ist `navigator.share()` mit File-Anhang (öffnet iOS-Sharesheet → „In Dateien sichern" / AirDrop / Mail). Fallback `<a download>` für Desktop-Browser.

**Begründung:** Native iOS-UX, kein eigenes Sharesheet bauen, funktioniert auch wenn die App vom Home-Bildschirm gestartet wurde.

**Auswirkung:** Backup-Button zeigt jetzt das System-Sharesheet. Import bleibt klassischer File-Input.

---

## 2026-05-16 — flushSave gegen Race-Condition beim Verlassen

**Kontext:** Auto-Save war debounced auf 800 ms. Wer schnell „Zurück" → „Open" tippte, las das Projekt aus IndexedDB bevor der Save fertig war — Blob fehlte, `createImageBitmap` schlug fehl, Projekt war nicht öffenbar.

**Entscheidung:** Beim Verlassen wird der Save flushed (Timer abgebrochen, Save synchron ausgeführt, await auf Completion). Erst dann Screen-Wechsel und ResumeList-Render.

**Begründung:** Verhindert die Race-Condition komplett. Kostet im schlimmsten Fall ~200 ms Wartezeit beim Zurück-Tippen.

**Auswirkung:** Projekte sind nach „Zurück" garantiert vollständig persistiert. `resumeProject` fängt zusätzlich Errors ab und zeigt Toast, falls doch mal etwas fehlt.

---

## 2026-05-16 — Projekt-Name mit Datum + Uhrzeit

**Kontext:** Zwei Projekte am gleichen Tag hatten den gleichen Anzeigenamen („Project 5/16/2026") und damit den gleichen Backup-Dateinamen.

**Entscheidung:** Projektname enthält Datum + Stunden:Minuten im ISO-Stil (`Project 2026-05-16 18:47`).

**Begründung:** Eindeutig pro Minute, sortierbar als String, dateinamen-sicher (Sanitizing der Backup-Files macht aus `:` und Spaces sowieso `-`).

**Auswirkung:** Mehrere Projekte am selben Tag sind sauber unterscheidbar in Projekt-Liste und in Backup-Dateinamen.
