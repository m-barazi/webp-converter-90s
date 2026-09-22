# Photo to WebP Converter

A fast, **100% client-side** web app that converts images from many common formats into **WebP**. Your images never leave your device — all processing happens directly in your browser.

Built with a nostalgic **90s / Windows 95** design: chunky bevels, rainbow text, marquee banners, and classic grey tiled backgrounds.

## 🚀 Live Demo

Open `index.html` in any modern browser, or run a tiny local server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## ✨ Features

- **Drag & Drop** upload
- Select multiple images at once
- Live preview with file name, format, and size
- Remove individual images or clear all
- Convert to **WebP** locally in the browser
- Adjustable quality slider (1–100%, default 85%)
- "Lossless WebP" option
- Optional max width / height with automatic aspect ratio preservation
- Optional EXIF/metadata stripping
- Per-image and overall progress indicator
- Download individual WebP files or all files as a ZIP
- Clear error messages and retry support for failed images
- Responsive layout that keeps the retro style on mobile
- Privacy-first: no server uploads, no tracking

## 📸 Supported Input Formats

- JPG / JPEG
- PNG
- GIF
- BMP
- TIFF / TIF
- HEIC / HEIF
- AVIF
- SVG
- WebP

## 🔒 Privacy

All images are processed **locally in your browser**. Nothing is uploaded to any server. The app works completely offline once loaded.

## 🛠 Tech Stack

- HTML5 Single Page App
- Vanilla JavaScript (ES Modules)
- Tailwind CSS (CDN)
- Libraries loaded from CDN:
  - [JSZip](https://stuk.github.io/jszip/) — ZIP download
  - [FileSaver.js](https://github.com/eligrey/FileSaver.js/) — Saving blobs
  - [UTIF.js](https://github.com/photopea/UTIF.js) — TIFF decoding
  - [heic2any](https://github.com/alexcorvi/heic2any) — HEIC/HEIF decoding
- WebP encoding via the browser's native `canvas.toBlob('image/webp')`

## 📁 Project Structure

```
photo-to-webp-converter/
├── index.html       # App shell, CDN links, HTML templates
├── css/
│   └── 90s.css      # 90s/Windows 95 design system
├── js/
│   ├── app.js       # State, event wiring, coordination
│   ├── converter.js # Decode + WebP encode engine
│   ├── ui.js        # DOM rendering & progress updates
│   └── utils.js     # Helpers for bytes, formats, downloads
├── Dockerfile       # nginx-based production image
├── docker-compose.yml
├── nginx.conf       # nginx configuration with gzip + SPA fallback
├── README.md
└── package.json     # Minimal metadata + syntax-check script
```

## 🐳 Deployment with Docker

The app is served by a lightweight **nginx** container. No build step is needed because the app is already static.

### Build and run with Docker Compose

```bash
cd photo-to-webp-converter
docker compose up --build -d
```

The container uses **Traefik** labels and expects an external network called `traefik-public`. Adjust the hostname `webp.barazi.cloud` in `docker-compose.yml` to your own domain.

### Without Traefik (plain port mapping)

Uncomment the `ports` section in `docker-compose.yml`:

```yaml
ports:
  - "8080:80"
```

Then run:

```bash
docker compose up --build -d
```

The app is available at `http://localhost:8080`.

### Build manually

```bash
docker build -t webp-converter-90s .
docker run -p 8080:80 webp-converter-90s
```

## 🧑‍💻 Local Development

No build step required. Just serve the folder:

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .
```

A local server is recommended because some browsers restrict ES modules on `file://` URLs.

## ⚠️ Limitations

- "Lossless" sets quality to 100%. The browser canvas API produces lossy WebP by default; true lossless WebP would require a WASM library.
- Animated GIFs are converted to a single static WebP frame.
- Very large images are automatically downscaled to browser canvas limits.
- HEIC/HEIF and TIFF require their respective decoder libraries to load successfully from the CDN.

## 🌈 Why the 90s look?

Because it's fun. Beveled buttons, tiled backgrounds, rainbow headings, and marquee banners make the tool feel like a tiny piece of software history — while still being fast and useful today.

## 📜 License

Free to use for personal and commercial projects.

---

Made with 💾 and pixels.
