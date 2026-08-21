<p align="center">
  <img src="public/banner.jpg" alt="Nhạc - Live Band ChordPro Reader & Stage Viewer" width="100%" style="border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
</p>

<h1 align="center">🎵 Nhạc — Live Band ChordPro Reader & Stage Viewer</h1>

<p align="center">
  <em>The ultimate 100% offline ChordPro reader, setlist manager, and 1-screen stage viewer for gigging musicians, acoustic sessions, and tablet music stands.</em>
</p>

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" /></a>
  <a href="#-offline-architecture"><img src="https://img.shields.io/badge/Storage-IndexedDB_Dexie-2563EB?style=for-the-badge&logo=databricks&logoColor=white" alt="IndexedDB Dexie" /></a>
  <a href="#-installing-as-a-pwa-ipad--android--pc"><img src="https://img.shields.io/badge/PWA-100%25_Offline-10B981?style=for-the-badge&logo=pwa&logoColor=white" alt="100% Offline PWA" /></a>
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-amber.svg?style=for-the-badge" alt="MIT License" /></a>
</p>

---

## 📖 About Nhạc

**"Nhạc"** is the Vietnamese word for **"Music"** (*Âm Nhạc*). 

Designed from the ground up for live performers, band rehearsals, acoustic worship, and stage tablets, **Nhạc** eliminates cumbersome paper binders, messy PDF zooming, and internet connectivity worries. It delivers a fast, responsive, single-screen ChordPro reader that automatically fits entire chord sheets onto your display without requiring mid-song scrolling or page turns.

---

## 📑 Table of Contents

- [✨ Key Features](#-key-features)
- [🚀 Quick Start](#-quick-start)
- [📱 How to Use the App](#-how-to-use-the-app)
  - [1. Managing Your Song Library](#1-managing-your-song-library)
  - [2. Importing Songs & Entire Folders](#2-importing-songs--entire-folders)
  - [3. Real-Time Transposition & Capo](#3-real-time-transposition--capo)
  - [4. Creating & Managing Setlists](#4-creating--managing-setlists)
  - [5. Stage Performance Mode](#5-stage-performance-mode)
  - [6. 1-Screen Auto-Fit & Multi-Column Layout](#6-1-screen-auto-fit--multi-column-layout)
  - [7. Built-in ChordPro Editor](#7-built-in-chordpro-editor)
  - [8. Visual Themes & Customization](#8-visual-themes--customization)
  - [9. Library Backup & JSON Export/Import](#9-library-backup--json-exportimport)
- [🦶 Bluetooth Foot Pedal & Keyboard Shortcuts](#-bluetooth-foot-pedal--keyboard-shortcuts)
- [🎼 ChordPro Syntax Cheatsheet](#-chordpro-syntax-cheatsheet)
- [📲 Installing as a PWA (iPad / Android / PC)](#-installing-as-a-pwa-ipad--android--pc)
- [🛠️ Tech Stack & Architecture](#️-tech-stack--architecture)
- [📄 License](#-license)

---

## ✨ Key Features

- **🎼 True ChordPro Syntax Engine**: Parses standard `.cho`, `.crd`, `.pro`, `.chordpro`, and `.txt` files with support for directives (`{title}`, `{subtitle}`, `{artist}`, `{key}`, `{capo}`, `{tempo}`, `{time}`, `{comment}`, `{soc}`/`{eoc}`).
- **📁 One-Click Batch Folder Import**: Open entire folders of chord charts directly from your computer or tablet via the File System Access API.
- **⚡ 1-Screen Auto-Fit (Zero Page Turning)**: Smart multi-column engine (1, 2, or 3 columns) dynamically scales font size to fit complete songs onto a single view.
- **🎵 Real-Time Semitone Transpose & Capo**: Instant $+1 / -1$ semitone transposition with enharmonic flat/sharp toggle (`♭` vs `#`) and slash chord support (`G/B`, `C#m7b5`, `F#/A#`).
- **🎸 Stage Mode with Screen Wake Lock**: Distraction-free, high-contrast performance view with **Wake Lock API** to ensure your tablet screen stays awake throughout the gig.
- **🦶 Hands-Free Foot Pedal Support**: Bluetooth page-turner integration (AirTurn, PageFlip, Donner, Coda Stomp) and keyboard hotkeys.
- **📋 Live Setlist Manager**: Arrange song sequences for live sets, track live progress (e.g. *"Song 4 of 12"*), and transition smoothly between songs.
- **📱 100% Offline-First PWA**: Powered by **IndexedDB (Dexie.js)** and **Service Worker caching** — no Wi-Fi or cellular network required at venues.
- **🎨 Stage-Optimized Themes**: OLED Deep Black, Cyber Stage Dark, Warm Amber Vintage, and High Contrast Light mode with customizable chord accent colors.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` or `pnpm` or `yarn`

### Installation & Run
```bash
# 1. Clone the repository
git clone https://github.com/lyvuong/Nh-c.git
cd Nh-c

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`**.

### Production Build
```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📱 How to Use the App

### 1. Managing Your Song Library
- **Search**: Use the search bar in the left sidebar to filter songs by title, artist, original key, folder, or lyrics text.
- **Filters**: Quickly filter your library by **Starred Favorites (⭐)**, **Key**, or specific imported **Folders**.
- **Song Details**: Selecting any song displays its full metadata (Original Key, Transposed Key, Capo, Tempo BPM, Time Signature, and Setlist status).

### 2. Importing Songs & Entire Folders
- **Batch Folder Import**: Click **"Open Folder"** in the sidebar or header. Select any folder on your device containing `.cho`, `.crd`, `.pro`, `.txt`, or `.chordpro` files. The app parses and imports all files into IndexedDB instantly.
- **Direct Song Creation**: Click **"+ New Song"** to write or paste a new ChordPro chord sheet from scratch with live side-by-side preview.

### 3. Real-Time Transposition & Capo
- Located on the top control bar:
  - **`+1` / `-1`**: Transpose the key up or down semitone by semitone.
  - **`Reset`**: Immediately restore original song key.
  - **`Capo (+/-)`**: Adjust capo fret position; chords update accordingly.
  - **`♭ / #` Toggle**: Switch enharmonic preference between flats (e.g. `Bb`, `Eb`, `Ab`) and sharps (e.g. `A#`, `D#`, `G#`).

### 4. Creating & Managing Setlists
1. Click **"Manage Setlists"** in the sidebar.
2. Click **"Create New Setlist"** and give your setlist a name (e.g., *Friday Live Acoustic*, *Worship Sunday*).
3. Add songs from your library, drag or re-order the song sequence.
4. Select the active setlist from the sidebar dropdown to filter the library to that specific set.

### 5. Stage Performance Mode
- Click **"Stage Mode"** (top right) or press the `F` key to enter the fullscreen performance view.
- Stage Mode provides:
  - High-visibility typography with illuminated chords.
  - Current song progress indicator (e.g., *"Song 3 of 10"*).
  - Next song quick preview banner.
  - Visual metronome pulse matching the song's BPM.
  - Full hands-free Bluetooth pedal navigation.

### 6. 1-Screen Auto-Fit & Multi-Column Layout
- Toggle the **"Auto-Fit"** button to automatically calculate the optimal font size and column layout so the entire song fits onto your screen without scrolling.
- Alternatively, select **1, 2, or 3 Columns** manually depending on whether your tablet is in portrait or landscape orientation.
- Use **"Auto-Scroll"** with adjustable BPM speed for longer arrangements.

### 7. Built-in ChordPro Editor
- Click **"Edit Song"** to open the modal editor:
  - Full syntax highlighting for `{title}`, `{key}`, `{artist}`, `{tempo}`, `{comment}`, and `[Chords]`.
  - Quick chord insertion bar (`[C]`, `[G]`, `[Am]`, `[F]`, etc.).
  - Real-time side-by-side formatted preview.

### 8. Visual Themes & Customization
- Click the **Settings (⚙️)** icon in the header to customize:
  - **Theme**: *Stage Dark (Cyber Cyan)*, *OLED True Black*, *Warm Amber Live*, or *High-Contrast Studio Light*.
  - **Chord Accent Color**: Cyan, Electric Amber, Emerald Green, Neon Purple, Coral Red, or Pure White.
  - **Font Size Scale** & **Line Spacing**.

### 9. Library Backup & JSON Export/Import
- In the **Settings** menu:
  - Click **"Export Library Backup (JSON)"** to download all songs, chords, tags, and setlists.
  - Click **"Import Library Backup"** to restore your data on any device or tablet.

---

## 🦶 Bluetooth Foot Pedal & Keyboard Shortcuts

Nhạc is fully compatible with wireless Bluetooth foot pedals (**AirTurn**, **PageFlip Butterfly/Firefly**, **Donner**, **Coda Music Stomp**, **iRig BlueTurn**) configured to standard keyboard modes:

| Action | Foot Pedal Event | Keyboard Key |
|---|---|---|
| **Next Song / Next Page** | Pedal Right / Down | `ArrowRight`, `PageDown`, `Space`, `Enter` |
| **Previous Song / Prev Page** | Pedal Left / Up | `ArrowLeft`, `PageUp`, `Backspace` |
| **Transpose Up (+1)** | — | `+` or `=` |
| **Transpose Down (-1)** | — | `-` or `_` |
| **Reset Transpose** | — | `0` or `r` |
| **Toggle Stage Mode** | — | `f` or `F11` |
| **Toggle Auto-Scroll** | — | `s` or `S` |
| **Exit Stage / Close Modal** | — | `Escape` |

---

## 🎼 ChordPro Syntax Cheatsheet

Nhạc natively parses standard ChordPro formatting. Here is a quick reference:

### Directives
```chordpro
{title: Hotel California}
{subtitle: Live Acoustic}
{artist: Eagles}
{key: Bm}
{capo: 2}
{tempo: 75}
{time: 4/4}

{comment: Intro - 12-string Acoustic Guitar}
[Bm] [F#7] [A] [E9] [G] [D] [Em] [F#7]

{start_of_verse}
[Bm] On a dark desert highway, [F#7] cool wind in my hair
[A] Warm smell of colitas, [E9] rising up through the air
[G] Up ahead in the distance, [D] I saw a shimmering light
[Em] My head grew heavy and my sight grew dim, [F#7] I had to stop for the night
{end_of_verse}

{start_of_chorus}
[G] Welcome to the Hotel [D] California
Such a [F#7] lovely place, such a [Bm] lovely face
[G] Plenty of room at the Hotel [D] California
Any [Em] time of year, you can [F#7] find it here
{end_of_chorus}
```

---

## 📲 Installing as a PWA (iPad / Android / PC)

Nhạc is an installable Progressive Web App that works 100% offline without requiring app store installation:

### 🍏 iPad & iPhone (Safari)
1. Open the web app URL in **Safari**.
2. Tap the **Share button** (square with upward arrow).
3. Scroll down and tap **"Add to Home Screen"**.
4. Launch **Nhạc** from your home screen — it will open in full standalone app mode with zero browser address bars!

### 🤖 Android Tablets & Phones (Chrome / Edge)
1. Open the app in **Google Chrome**.
2. Tap the **three dots (⋮)** menu at top right.
3. Tap **"Install App"** or **"Add to Home Screen"**.

### 💻 Windows / macOS / Linux (Chrome / Edge / Brave)
1. In the address bar, click the **Install icon** (or menu > *Install Nhạc*).
2. The app will install as a native desktop window.

---

## 🛠️ Tech Stack & Architecture

- **UI Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + CSS Grid & Flexbox auto-fit engine
- **Local Persistence**: [Dexie.js](https://dexie.com/) (IndexedDB wrapper with live reactive query hooks)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Offline Shell**: Custom Service Worker + Web App Manifest
- **Device APIs**: 
  - [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) (prevents sleep during gigs)
  - [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) (directory batch file importing)

```
Nh-c/
├── public/
│   ├── banner.jpg         # Stage hero banner (16:9)
│   ├── logo.jpg           # High-res app logo (1:1)
│   ├── icon.jpg           # Mobile app icon tile
│   ├── favicon.svg        # Vector SVG favicon & brand icon
│   ├── manifest.json      # PWA Web App Manifest
│   └── sw.js              # Offline Service Worker
├── src/
│   ├── components/
│   │   ├── ChordProViewer.tsx     # 1-screen auto-fit chord renderer
│   │   ├── Header.tsx             # Main app header & quick controls
│   │   ├── Sidebar.tsx            # Song library, search & setlist selector
│   │   ├── StageModeView.tsx      # Fullscreen live stage performance mode
│   │   ├── TransposeBar.tsx       # Semitone transpose & capo toolbar
│   │   ├── SongEditorModal.tsx    # ChordPro editor & live preview
│   │   ├── SetlistEditorModal.tsx # Setlist creator & song ordering
│   │   ├── FolderImportModal.tsx  # Batch folder importer
│   │   └── SettingsModal.tsx      # Themes, colors, backup & restore
│   ├── lib/
│   │   ├── chordParser.ts         # ChordPro directive & line parser
│   │   ├── chordTransposer.ts     # Enharmonic smart transposition engine
│   │   ├── db.ts                  # Dexie.js IndexedDB schema & store
│   │   ├── sampleSongs.ts         # Initial song library seeds
│   │   └── themeManager.ts        # Stage themes & chord color manager
│   ├── App.tsx                    # Main state machine & hotkey listener
│   └── main.tsx                   # React root entry point
├── package.json
└── README.md
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<p align="center">
  Made with ❤️ for live musicians everywhere • <strong>Nhạc</strong>
</p>
