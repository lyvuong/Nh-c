import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type DBSong, type DBSetlist } from './lib/db';
import { initDefaultData } from './lib/sampleSongs';
import { parseChordPro, transposeParsedSong, type ParsedSong } from './lib/chordParser';
import { getSemitoneDistance } from './lib/chordTransposer';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TransposeBar } from './components/TransposeBar';
import { ChordProViewer } from './components/ChordProViewer';
import { StageModeView } from './components/StageModeView';
import { FolderImportModal } from './components/FolderImportModal';
import { SetlistEditorModal } from './components/SetlistEditorModal';
import { SongEditorModal } from './components/SongEditorModal';
import { SettingsModal } from './components/SettingsModal';
import { AboutModal } from './components/AboutModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { applyThemeToDOM } from './lib/themeManager';

export function App() {
  // IndexedDB Live Queries
  const songs = useLiveQuery(() => db.songs.toArray()) || [];
  const setlists = useLiveQuery(() => db.setlists.toArray()) || [];

  // Active Song & Setlist Selection
  const [activeSongId, setActiveSongId] = useState<number | null>(null);
  const [activeSetlistId, setActiveSetlistId] = useState<number | null>(null);

  // Transpose & View Controls
  const [semitones, setSemitones] = useState<number>(0);
  const [currentCapo, setCurrentCapo] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [columnsPreference, setColumnsPreference] = useState<'auto' | 1 | 2 | 3>('auto');
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);

  // Auto-scroll
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeedBpm, setScrollSpeedBpm] = useState<number>(80);
  const viewerScrollContainerRef = useRef<HTMLDivElement>(null);

  // Modes & Modals
  const [isStageMode, setIsStageMode] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isFolderImportOpen, setIsFolderImportOpen] = useState<boolean>(false);
  const [isSetlistEditorOpen, setIsSetlistEditorOpen] = useState<boolean>(false);
  const [isSongEditorOpen, setIsSongEditorOpen] = useState<boolean>(false);
  const [editingSong, setEditingSong] = useState<DBSong | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState<boolean>(false);

  // App Theme & Styling with persistence
  const [stageTheme, setStageTheme] = useState<string>(() => {
    return localStorage.getItem('stagechord_theme') || 'stage-dark';
  });
  const [chordColor, setChordColor] = useState<string>(() => {
    return localStorage.getItem('stagechord_chord_color') || '#38bdf8';
  });
  const [preferFlats, setPreferFlats] = useState<boolean>(() => {
    return localStorage.getItem('stagechord_prefer_flats') === 'true';
  });

  // Initialize Sample Data on first load
  useEffect(() => {
    initDefaultData(db);
  }, []);

  // Select first song automatically when songs load
  useEffect(() => {
    if (songs.length > 0 && activeSongId === null) {
      setActiveSongId(songs[0].id!);
    }
  }, [songs, activeSongId]);

  // Apply Theme & Chord Color immediately to DOM
  useEffect(() => {
    applyThemeToDOM(stageTheme, chordColor);
    localStorage.setItem('stagechord_theme', stageTheme);
    localStorage.setItem('stagechord_chord_color', chordColor);
  }, [stageTheme, chordColor]);

  useEffect(() => {
    localStorage.setItem('stagechord_prefer_flats', preferFlats.toString());
  }, [preferFlats]);

  // Active Song Record from DB
  const activeSong = useMemo(() => {
    return songs.find((s) => s.id === activeSongId) || null;
  }, [songs, activeSongId]);

  // Reset Transposition and update document title when song changes
  useEffect(() => {
    if (activeSong) {
      setSemitones(0);
      setCurrentCapo(activeSong.capo || 0);
      document.title = `${activeSong.title} • Nhạc`;
    } else {
      document.title = 'Nhạc';
    }
  }, [activeSong, activeSongId]);

  // Active Setlist Record
  const activeSetlist = useMemo(() => {
    if (!activeSetlistId) return null;
    return setlists.find((s) => s.id === activeSetlistId) || null;
  }, [setlists, activeSetlistId]);

  // Next & Previous Song IDs for Setlist or Library
  const { prevSongId, nextSongId, prevSongTitle, nextSongTitle, totalListCount, currentListIndex } =
    useMemo(() => {
      let list: DBSong[] = [];
      if (activeSetlist) {
        list = activeSetlist.songs
          .map((item) => songs.find((s) => s.id === item.songId))
          .filter(Boolean) as DBSong[];
      } else {
        list = songs;
      }

      const idx = list.findIndex((s) => s.id === activeSongId);
      const prev = idx > 0 ? list[idx - 1] : undefined;
      const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : undefined;

      return {
        prevSongId: prev?.id,
        nextSongId: next?.id,
        prevSongTitle: prev?.title,
        nextSongTitle: next?.title,
        totalListCount: list.length,
        currentListIndex: idx >= 0 ? idx : 0,
      };
    }, [activeSetlist, songs, activeSongId]);

  // Parsed and Transposed Song
  const parsedTransposedSong = useMemo<ParsedSong | null>(() => {
    if (!activeSong) return null;
    const parsed = parseChordPro(activeSong.content);
    return transposeParsedSong(parsed, semitones, preferFlats);
  }, [activeSong, semitones, preferFlats]);

  // Transpose Handlers
  const handleTranspose = (delta: number) => {
    setSemitones((prev) => prev + delta);
  };

  const handleResetTranspose = () => {
    setSemitones(0);
  };

  const handleSelectKey = (targetKey: string) => {
    if (!parsedTransposedSong?.metadata.key) return;
    const distance = getSemitoneDistance(parsedTransposedSong.metadata.key, targetKey);
    setSemitones((prev) => prev + distance);
  };

  // Smooth Auto-scroll animation logic
  useEffect(() => {
    if (!isAutoScrolling) return;

    const findScrollTarget = () => {
      return (
        document.querySelector('.chordpro-scroll-surface') ||
        document.querySelector('.chordpro-viewer-container') ||
        viewerScrollContainerRef.current
      ) as HTMLElement | null;
    };

    let animationFrameId: number;
    let lastTimestamp = performance.now();
    let exactScrollTop = 0;

    const el = findScrollTarget();
    if (el) {
      // If user is already near the bottom, restart scroll from top
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
        el.scrollTop = 0;
      }
      exactScrollTop = el.scrollTop;
    }

    // Dynamic speed based on BPM (e.g. 60 BPM -> 35 px/sec, 120 BPM -> 70 px/sec)
    const pixelsPerSecond = Math.max(12, scrollSpeedBpm * 0.55);

    const step = (now: number) => {
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      const target = findScrollTarget();
      if (target) {
        exactScrollTop += pixelsPerSecond * delta;
        target.scrollTop = exactScrollTop;

        // Automatically stop at end of song
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 4) {
          setIsAutoScrolling(false);
          return;
        }
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAutoScrolling, scrollSpeedBpm]);

  // Star / Favorite Toggle
  const handleToggleFavorite = async (songId?: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const targetId = songId || activeSongId;
    if (!targetId) return;

    const song = songs.find((s) => s.id === targetId);
    if (song) {
      await db.songs.update(targetId, {
        isFavorite: !song.isFavorite,
        updatedAt: Date.now(),
      });
    }
  };

  // Import Songs from Folder
  const handleImportSongs = async (newSongs: Omit<DBSong, 'id'>[]) => {
    await db.songs.bulkAdd(newSongs as DBSong[]);
    const all = await db.songs.toArray();
    if (all.length > 0) {
      setActiveSongId(all[all.length - 1].id!);
    }
  };

  // Save Setlist
  const handleSaveSetlist = async (data: Omit<DBSetlist, 'id'>, id?: number) => {
    if (id) {
      await db.setlists.update(id, data);
    } else {
      const newId = await db.setlists.add(data as DBSetlist);
      setActiveSetlistId(newId as number);
    }
  };

  // Delete Setlist
  const handleDeleteSetlist = async (id: number) => {
    await db.setlists.delete(id);
    if (activeSetlistId === id) {
      setActiveSetlistId(null);
    }
  };

  // Save Song (New or Edit)
  const handleSaveSong = async (songData: Omit<DBSong, 'id'>, id?: number) => {
    if (id) {
      await db.songs.update(id, songData);
    } else {
      const newId = await db.songs.add(songData as DBSong);
      setActiveSongId(newId as number);
    }
  };

  // Delete Song
  const handleDeleteSong = async (id: number) => {
    await db.songs.delete(id);
    const remaining = songs.filter((s) => s.id !== id);
    if (remaining.length > 0) {
      setActiveSongId(remaining[0].id!);
    } else {
      setActiveSongId(null);
    }
  };

  // Backup Export
  const handleExportBackup = async () => {
    const allSongs = await db.songs.toArray();
    const allSetlists = await db.setlists.toArray();
    const backupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      songs: allSongs,
      setlists: allSetlists,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StageChord_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Backup Import
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.songs && Array.isArray(parsed.songs)) {
        await db.songs.clear();
        await db.songs.bulkAdd(parsed.songs);
      }
      if (parsed.setlists && Array.isArray(parsed.setlists)) {
        await db.setlists.clear();
        await db.setlists.bulkAdd(parsed.setlists);
      }
      alert('Library backup successfully imported!');
      setIsSettingsOpen(false);
    } catch (err) {
      alert('Failed to parse backup JSON file.');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-stage-bg text-stage-text overflow-hidden select-none">
      {/* Fullscreen Stage Mode View */}
      {isStageMode && parsedTransposedSong && (
        <StageModeView
          currentSong={parsedTransposedSong}
          songIndex={currentListIndex}
          totalSongs={totalListCount}
          setlistName={activeSetlist?.name || 'All Songs'}
          nextSongTitle={nextSongTitle}
          previousSongTitle={prevSongTitle}
          onNextSong={() => nextSongId && setActiveSongId(nextSongId)}
          onPrevSong={() => prevSongId && setActiveSongId(prevSongId)}
          onExitStageMode={() => setIsStageMode(false)}
          semitones={semitones}
          onTranspose={handleTranspose}
          onResetTranspose={handleResetTranspose}
          capo={currentCapo}
          zoomLevel={zoomLevel}
          onZoomChange={(delta) => setZoomLevel((z) => Math.max(0.6, Math.min(1.8, z + delta)))}
          stageTheme={stageTheme}
          chordColor={chordColor}
        />
      )}

      {/* Left Sidebar (Song Library & Setlist Picker) */}
      <Sidebar
        songs={songs}
        setlists={setlists}
        activeSongId={activeSongId || undefined}
        activeSetlistId={activeSetlistId}
        onSelectSong={(id) => {
          setActiveSongId(id);
          setIsMobileSidebarOpen(false);
        }}
        onSelectSetlist={(id) => setActiveSetlistId(id)}
        onCreateSong={() => {
          setEditingSong(null);
          setIsSongEditorOpen(true);
        }}
        onOpenFolderImport={() => setIsFolderImportOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        onOpenSetlistEditor={() => setIsSetlistEditorOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onToggleFavorite={(id, e) => handleToggleFavorite(id, e)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <Header
          currentSong={activeSong}
          activeSetlist={activeSetlist}
          songIndex={currentListIndex}
          totalSongsInSetlist={totalListCount}
          onToggleSidebarMobile={() => setIsMobileSidebarOpen(true)}
          onEnterStageMode={() => setIsStageMode(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFolderImport={() => setIsFolderImportOpen(true)}
          onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
          onToggleFavorite={() => handleToggleFavorite()}
        />

        {/* Musician Transpose & Auto-Fit Toolbar */}
        {activeSong && parsedTransposedSong && (
          <TransposeBar
            currentKey={parsedTransposedSong.metadata.key}
            originalKey={activeSong.key}
            semitones={semitones}
            onTranspose={handleTranspose}
            onResetTranspose={handleResetTranspose}
            onSelectKey={handleSelectKey}
            zoomLevel={zoomLevel}
            onZoomChange={(delta) => setZoomLevel((z) => Math.max(0.6, Math.min(1.8, z + delta)))}
            columns={columnsPreference}
            onColumnsChange={setColumnsPreference}
            isAutoFit={isAutoFit}
            onToggleAutoFit={() => setIsAutoFit(!isAutoFit)}
            isAutoScrolling={isAutoScrolling}
            onToggleAutoScroll={() => setIsAutoScrolling(!isAutoScrolling)}
            scrollSpeedBpm={scrollSpeedBpm}
            onScrollSpeedChange={setScrollSpeedBpm}
            onEditSong={() => {
              setEditingSong(activeSong);
              setIsSongEditorOpen(true);
            }}
            preferFlats={preferFlats}
            onTogglePreferFlats={() => setPreferFlats(!preferFlats)}
          />
        )}

        {/* ChordPro Song Rendering Surface (1-Screen Auto-Fit) */}
        <div
          ref={viewerScrollContainerRef}
          className="flex-1 overflow-hidden bg-stage-bg p-1 sm:p-2 flex flex-col"
        >
          {parsedTransposedSong ? (
            <ChordProViewer
              song={parsedTransposedSong}
              capo={currentCapo}
              zoomLevel={zoomLevel}
              columnsPreference={columnsPreference}
              isAutoFit={isAutoFit}
              isAutoScrolling={isAutoScrolling}
              themeStyle={stageTheme}
              chordColor={chordColor}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stage-muted">
              <div className="w-16 h-16 rounded-2xl bg-stage-card flex items-center justify-center text-stage-accent mb-4 shadow-xl border border-stage-border">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-stage-text">No Song Selected</h3>
              <p className="text-xs text-stage-muted mt-1 max-w-sm">
                Open a folder of ChordPro charts from your device or select a song from the library.
              </p>
              <button
                onClick={() => setIsFolderImportOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-600/20 active:scale-95 transition"
              >
                Open Song Folder
              </button>
            </div>
          )}
        </div>

        {/* Bottom Viewer Footer Bar with About / Info Link */}
        <footer className="bg-stage-card/90 border-t border-stage-border px-3 py-1.5 flex items-center justify-between text-[11px] text-stage-muted flex-shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-stage-text truncate">
              {activeSong ? `${activeSong.title} (${activeSong.key || 'C'})` : 'Nhạc Live ChordPro'}
            </span>
            {activeSong?.tempo && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-stage-bg border border-stage-border text-cyan-400">
                {activeSong.tempo} BPM
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setIsAboutOpen(true)}
              className="text-stage-accent hover:text-cyan-300 font-semibold transition cursor-pointer flex items-center gap-1"
              title="About Nhạc, features & shortcuts"
            >
              <span>About / Info</span>
            </button>
            <span className="hidden sm:inline opacity-40">•</span>
            <span className="hidden sm:inline font-mono text-[10px] text-emerald-400">100% Offline</span>
          </div>
        </footer>
      </main>

      {/* Modals */}
      <FolderImportModal
        isOpen={isFolderImportOpen}
        onClose={() => setIsFolderImportOpen(false)}
        onImportSongs={handleImportSongs}
      />

      <SetlistEditorModal
        isOpen={isSetlistEditorOpen}
        onClose={() => setIsSetlistEditorOpen(false)}
        songs={songs}
        setlists={setlists}
        activeSetlistId={activeSetlistId}
        onSaveSetlist={handleSaveSetlist}
        onDeleteSetlist={handleDeleteSetlist}
        onSelectSetlist={setActiveSetlistId}
      />

      <SongEditorModal
        key={isSongEditorOpen ? (editingSong?.id || 'new') : 'closed'}
        isOpen={isSongEditorOpen}
        onClose={() => {
          setIsSongEditorOpen(false);
          setEditingSong(null);
        }}
        song={editingSong}
        onSaveSong={handleSaveSong}
        onDeleteSong={handleDeleteSong}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        stageTheme={stageTheme}
        onSelectTheme={setStageTheme}
        preferFlats={preferFlats}
        onTogglePreferFlats={() => setPreferFlats(!preferFlats)}
        chordColor={chordColor}
        onSelectChordColor={setChordColor}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onResetSampleLibrary={() => initDefaultData(db)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <GoogleDriveModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        onOpenFolderImport={() => setIsFolderImportOpen(true)}
      />
    </div>
  );
}

export default App;
