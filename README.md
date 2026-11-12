# 🦍 QBasic Gorillas (1991 MS-DOS Edition)

A faithful, modern recreation of the classic 1991 MS-DOS **`GORILLA.BAS`** artillery game included with QBasic—built with React 19, TypeScript, HTML5 Canvas, a zero-dependency Web Audio API 8-bit synthesizer, and offline-first **IndexedDB** statistics.

---

## ✨ Features

- **Authentic 1991 EGA Aesthetics**:
  - Procedural destructible city skyline in authentic EGA colors (`#00AAAA`, `#AA0000`, `#AAAAAA`, etc.) with lit/unlit window grids.
  - Real pixel-level crater carving (`destination-out` compositing) that allows subsequent banana throws to pass through blasted holes in buildings.
  - Optional retro CRT scanline & vignette overlay.
- **Reactive Smiling Sun**:
  - Watches the action from the top of the sky, gasps (`:O`) when a banana flies close by, and gets dizzy (`X_X`) on a direct hit.
- **Full Ballistic Physics & Dynamic Wind**:
  - Supports full launch angles from **`-90°` to `+90°`** (both high arcs into the sky and downward shots from tall skyscrapers).
  - Smart wind system that scales safely to gorilla separation distance and alternates directions so rounds never get locked into an impassable headwind wall.
  - Multiple planetary gravity presets: **Moon** ($1.62\text{ m/s}^2$), **Mars** ($3.71\text{ m/s}^2$), **Earth** ($9.8\text{ m/s}^2$), and **Jupiter** ($24.79\text{ m/s}^2$).
- **Game Modes & AI**:
  - **1P vs CPU**: Three distinct AI difficulty levels (*Rookie*, *Veteran*, *Cyber Gorilla / Master*) with ballistic calculation and adaptive shot-error learning.
  - **2P Hotseat**: Classic local pass-and-play multiplayer.
  - **Sandbox Mode**: Practice trajectories with optional ballistic arc preview.
- **Procedural 8-Bit Web Audio**:
  - 100% synthesized sound effects (banana throw swoosh, sun gasp/hit, white-noise building & sub-bass gorilla explosions, victory fanfare) using the native Web Audio API.
- **Hall of Fame & IndexedDB Statistics**:
  - Offline-first persistent database (`GorillasGameDB` via native IndexedDB with `localStorage` fallback).
  - Tracks wins per difficulty level, win streaks, hole-in-one shots, minimum shots to win a round, strongest headwind overcome, sun gasps/hits, craters carved, friendly fire, and full match history.
  - Portable **JSON Backup Export & Import** with strict schema sanitization.

---

## 🎮 Controls

| Control | Action |
| :--- | :--- |
| **`↑` / `↓`** | Adjust Launch Angle (`-90°` to `+90°`) |
| **`←` / `→`** | Adjust Throw Power (`1` to `100`) |
| **`SPACE` / `ENTER`** | Throw Banana |
| **Mouse Drag on Gorilla** | Interactive Slingshot Aiming (Angle & Power) |
| **`ESC`** | Pause Menu |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+ and **npm**

### Installation & Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server at http://localhost:3000
npm run dev
```

### Testing & Coverage

```bash
# Run unit test suite
npm test

# Run unit tests with V8 code coverage report (>= 80% threshold)
npm run test:coverage

# Type-check with TypeScript
npm run lint

# Build production bundle
npm run build
```

### Desktop App & Installers (Electron)

QBasic Gorillas can be run and packaged as a native desktop application (just like VS Code, using **Electron** and **electron-builder**):

```bash
# Run desktop app in development mode
npm run electron:dev

# Generate native installers in ./release
npm run electron:build:mac    # macOS (.dmg & .zip)
npm run electron:build:win    # Windows (.exe NSIS & portable)
npm run electron:build:linux  # Linux (.AppImage & .deb)
```

---

## 🔒 Security, Privacy & Legal Compliance

- **100% Client-Side (Zero Telemetry)**: Runs entirely in the browser with zero external API keys, tracking scripts, ad cookies, or backend servers required.
- **GDPR / ePrivacy Cookie & Storage Consent**:
  - First-visit consent banner and granular preferences dialog (`Essential Storage`, optional `IndexedDB Local Statistics`, and optional `Google Fonts` external typography).
  - Disabling external fonts falls back cleanly to system monospace fonts with zero third-party network requests.
- **Hardened Data Import**: Backup JSON imports enforce a 2 MB size cap, strip prototype-pollution keys (`__proto__`, `constructor`, `prototype`), and sanitize all numeric and string fields before writing to IndexedDB.
- **In-Game Legal Center**: Accessible from the Title Screen and Settings modal with full **Legal Notice**, **Privacy Policy (GDPR/CCPA)**, **Cookies Policy (LSSI-CE)**, and **Terms & Photosensitivity Warning** (explaining how to toggle `CRT OFF`).

---

## 🌿 Git Workflow

This repository follows a standard **Git Flow** branching model:

- **`main`**: Production-ready stable releases.
- **`develop`**: Integration branch for upcoming features and fixes.
- **`feature/*`**: Short-lived feature branches created from `develop` (e.g. `feature/legal-and-readme-docs`), merged back into `develop`, and promoted to `main` via Pull Request.

---

## 📄 License & Trademark Disclaimer

Licensed under the **[Apache License 2.0](./LICENSE)**.

> **Unofficial Tribute Disclaimer**: *QBasic Gorillas* is an independent, non-commercial, open-source recreation inspired by the classic 1991 `GORILLA.BAS` included with MS-DOS / QBasic. Microsoft®, MS-DOS®, and QBasic® are registered trademarks of Microsoft Corporation. This project is not affiliated with, endorsed by, or sponsored by Microsoft Corporation.
