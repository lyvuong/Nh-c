# 🎸 LV5 StageChord Pro (DCD) - Band ChordPro PWA

**LV5 StageChord Pro** (DCD Edition) is a high-performance, 100% offline Progressive Web App (PWA) built specifically for band rehearsals, gigging musicians, setlist management, and tablet music stands.

---

## 🌟 Key Features

1. **🎼 True ChordPro Parser & Renderer**:
   - Parses standard ChordPro syntax (`.cho`, `.crd`, `.pro`, `.chordpro`, `.txt`) and chord directives (`{title}`, `{subtitle}`, `{artist}`, `{key}`, `{capo}`, `{tempo}`, `{time}`, `{comment}`, `{soc}`, `{eoc}`).
   - Renders chords on dedicated lines **directly above the lyrics** with precise alignment and custom color highlighting.

2. **📁 Local Folder-Level Import**:
   - Open entire song folders from your computer, tablet, or phone with one click using the File System Access API or directory picker.
   - Batch scans, parses metadata, and imports songs into the local library.

3. **📱 100% Offline by Design**:
   - Uses **IndexedDB** for local persistence of your entire song repertoire and setlists.
   - Integrated **Service Worker** caches the application shell so no internet or Wi-Fi is required at gigs.

4. **⚡ 1-Screen Auto-Fit Engine (Zero Page Turning)**:
   - Dynamic multi-column layout (1, 2, or 3 columns) tailored to your tablet or mobile screen size.
   - Auto-scaling font algorithm dynamically fits the complete song onto a single screen so you never need to scroll or turn pages while performing.

5. **🎵 Semitone Transposition & Capo Tool**:
   - Transpose $+1$ or $-1$ semitone in real-time with instant Reset button.
   - Smart enharmonic handling (Sharps `#` vs Flats `♭`).
   - Supports jazz, 7th/9th/dim/sus chords, and slash chords (e.g. `G/B`, `C#m7b5`, `F#/A#`).
   - Integrated Capo calculator and indicator.

6. **📋 Setlist Builder & Gig Manager**:
   - Create, edit, rename, and arrange song sequences for upcoming gigs.
   - Live stage view displays upcoming songs and current track progress (e.g. "Song 3 of 12").

7. **🎸 Stage Mode & Bluetooth Pedal Navigation**:
   - Fullscreen, distraction-free live performance view.
   - **Screen Wake Lock API** prevents the tablet display from dimming or going to sleep during live shows.
   - Foot pedal & keyboard shortcuts:
     - **Next Song**: Bluetooth Pedal "Down" / `ArrowRight` / `PageDown` / `Space` / `Enter`
     - **Previous Song**: Bluetooth Pedal "Up" / `ArrowLeft` / `PageUp` / `Backspace`
     - **Transpose**: `+` / `-` keys or `0`/`r` to reset
     - **Exit Stage**: `Escape`
   - Visual metronome pulse indicator for tempo cues.

8. **🔍 Instant Search & Multi-filter**:
   - Search across title, artist, key, tempo, tags, and lyrics instantly.
   - Filter by Key, Setlist, or Starred favorites.

---

## 🚀 Quick Start

### 1. Run Development Server
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 2. Build for Production
```bash
npm run build
npm run preview
```

---

## 📲 Installing as a PWA on Tablets / Phones

1. Open the app in **Chrome / Edge / Safari** on your iPad, Android tablet, or phone.
2. Tap **"Share"** (iOS) or the **three dots menu** (Android/Chrome).
3. Select **"Add to Home Screen"** or **"Install LV5 StageChord"**.
4. Launch the standalone app directly from your home screen — fully offline ready!

---

## 🛠️ Tech Stack
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Stage Themes (OLED Black, Stage Dark, Warm Amber, High Contrast Light)
- **Database**: IndexedDB via Dexie.js
- **Icons**: Lucide React
- **PWA**: Service Worker & Web App Manifest
