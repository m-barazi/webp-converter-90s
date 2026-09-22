# Photo to WebP Converter

## Projekt-Kontext

Kleine, selbstständige Web-App zur lokalen Konvertierung von Bildern in WebP. Kein Backend, kein Build-Step, keine Frameworks.

## Tech-Stack

- **HTML5** Single Page App
- **Vanilla JavaScript** als ES Modules
- **Tailwind CSS** via CDN
- **90s / Windows 95 Design System** in `css/90s.css`

## Wichtige Dateien

| Datei | Zweck |
|---|---|
| `index.html` | App-Shell, CDN-Links, Templates |
| `css/90s.css` | Design-System: Keyframes, Bevels, Patterns |
| `js/app.js` | Event-Handler, State, Koordination |
| `js/converter.js` | Dekodierung & WebP-Encoding |
| `js/ui.js` | DOM-Rendering, Fortschritt, Stats |
| `js/utils.js` | Hilfsfunktionen (Bytes, Formate, Download) |
| `README.md` | Nutzungsanleitung |

## Design-System

- Kein `border-radius` irgendwo.
- Alle interaktiven Elemente haben 3D-Outset/Inset-Bevel.
- Farben: Windows-95-Palette (#C0C0C0, #000080, #0000FF, #FF0000, #FFFF00).
- Typografie: MS Sans Serif / Arial Black / Courier New.
- Muss enthalten: Marquee, Rainbow-Text, Hit Counter, Construction Stripes, Tiled Background.

## Erweiterungspunkte

- Echtes verlustfreies WebP via WASM-Library (libwebp.js).
- Animations-GIF zu animiertem WebP.
- Dunkelmodus (aktuell nur Light Mode, authentisch 90s).
- Drag-&-Drop-Sortierung der Dateiliste.

## Konventionen

- Inhalte auf Deutsch.
- Technische Begriffe im Original.
- ES-Module über `<script type="module">`.
- Externe Libraries nur via CDN.
