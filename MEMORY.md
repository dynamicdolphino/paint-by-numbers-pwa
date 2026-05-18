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

---

## 2026-05-17 — iOS Web-Share braucht synchronen User-Gesture-Kontext

**Kontext:** Michael berichtete dass das Backup-Speichern auf dem iPad „oft nicht" funktioniert — Klick auf den Backup-Button und visuell passierte einfach nichts. Reproduzierbar im PWA-Standalone-Modus (Home-Bildschirm), nicht im normalen Safari-Tab.

**Entscheidung / Erkenntnis:** Der bisherige `backupProject()` lief `await flushSave()` → `await dbGet()` → `await blobToBase64()` vor `navigator.share()`. iOS-Safari verfällt das User-Gesture-Token nach dem ersten `await`. Beim Aufruf von `share()` ist es weg, der Call rejected silent, und der `<a download>`-Fallback wird im PWA-Standalone von iOS komplett ignoriert. Net result: Klick → nichts.

Fix: Backup-Payload jetzt **vollständig synchron** aus `state.*` bauen (`canvas.toDataURL()` ist sync, eigene `dataURLToBlobSync()` parst Base64 selbst). `navigator.share()` läuft im selben Gesture. Wenn das trotzdem rejected oder nicht verfügbar ist, öffnet sich ein sichtbares Modal — dessen Buttons sind neue Gestures und können noch share/window.open. Damit der Backup nicht auf `dbGet()` warten muss, wurden `state.projectName` und `state.projectCreatedAt` ins State-Objekt gespiegelt.

**Begründung:** Der gleiche Bug existierte auch im `#save-btn` (toBlob-Callback ist async), wurde nur seltener bemerkt weil weniger benutzt — gleich mitgefixt. Beide nutzen jetzt denselben `openSaveSheet()`-Fallback, also einheitliches UX-Pattern.

**Auswirkung:** Backup und Image-Save funktionieren jetzt in iOS-PWA-Standalone zuverlässig. Architektur-Lehre für die ganze Codebase: Vor jedem `navigator.share()` darf kein `await` stehen. Bei neuen Share-/Download-Buttons immer das Modal-Pattern verwenden, das gibt einen sichtbaren Recovery-Pfad wenn iOS doch mal die erste Share-Anfrage ablehnt.

---

## 2026-05-17 — Slider raus, Preset-Pills rein

**Kontext:** Der `<input type="range">` mit den 4 numerischen Stufen 12/24/36/50 zwang den User zu einer Zahl-Entscheidung ohne Bedeutung. Auf Touch unangenehm präzise zu treffen.

**Entscheidung:** Ersetzt durch fünf Preset-Cards (Kids/Easy/Standard/Detailed/Fine) mit Label + Farbenzahl + Hinweistext. Plus `minPxFactor` pro Preset — „Kids" hat jetzt nicht nur weniger Farben sondern auch wirklich gröbere Felder (vorher: gleicher fester Threshold im Worker).

**Begründung:** Presets übersetzen die K-Zahl in Intent („Für Kinder" statt „8 Farben"). Card-Auswahl ist auf Touch zielsicher, kommuniziert die Auswahl klarer, und schafft Platz für den `hint`-Text. Mit dem neuen Cap von 8000 px im Worker können Kids-Presets auf hochauflösenden Fotos auch wirklich große Flächen mergen.

**Auswirkung:** `state.preset` ersetzt den Slider-Wert, `generateTemplate(k, minPxFactor)` bekommt beide Parameter, Worker-`mergeTiny` nutzt den durchgereichten Faktor. Default ist „Standard" (24) — bewusst eine Stufe niedriger als der bisherige Default-Slider (36), weil 24 für die meisten Fotos der bessere Startpunkt ist.

---

## 2026-05-17 — Text-Labels unter Icons für neue User

**Kontext:** Vier Icon-Buttons im Paint-Header ohne sichtbaren Text. Erfahrene User raten richtig, neue User wissen nicht was hinter „Auge", „Truhe", „Pfeil-runter" steckt — selbst mit `title=`-Attribut, weil das auf Touch nicht erscheint.

**Entscheidung:** Kleines `<span class="icon-label">` unter jedem Header-Icon (`Back`, `Template`, `Backup`, `Save`). 10 px, dim-Farbe, im Active-State accent. Header wird dadurch ~10 px höher — vernachlässigbar.

**Begründung:** Einfacher als eine First-Launch-Tour, kein State zu verwalten, funktioniert offline, sofort verständlich für Erstöffner. Im Floating-Toolbar (Brush/Eraser/Undo) bleiben die Labels weg, weil die Icons dort universeller sind und der Platz knapp ist.

**Auswirkung:** Header-CSS scoped per `.paint-header .icon-btn` und `.prep-header .icon-btn`, damit der Floating-Toolbar-Look unverändert bleibt.

---

## 2026-05-17 — Session-Pause, Backlog für nächste Session

**Kontext:** Drei offene Wünsche (Druck-PDF, Weniger-Farben-Preset, schönere Detail-Auswahl statt Slider). Session wird hier beendet, um Conversation-Tokens zu sparen.

**Entscheidung:** Alle drei Items strukturiert in `BACKLOG.md` festgehalten — mit konkretem Implementation-Plan, Bibliotheks-Empfehlung (pdf-lib für PDF), Code-Stellen und Akzeptanzkriterien.

**Begründung:** Die nächste Session (egal welche KI, egal wann) kann ohne Aufwärm-Runde direkt loslegen. Das BACKLOG erklärt nicht nur *was* zu tun ist, sondern auch *wo im Code* und *wie es konkret aussehen soll*.

**Auswirkung:** Nächste Session sollte beginnen mit `README.md` → `BACKLOG.md` → loslegen. MEMORY.md wird bei Implementierung um die jeweilige Entscheidung ergänzt, CHANGELOG.md bekommt einen neuen Versions-Eintrag.
