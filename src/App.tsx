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

function hexToRgbChannels(hex: string): string {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r} ${g} ${b}`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
  }
  return '56 189 248';
}

  // Apply Theme & Chord Color to document
  useEffect(() => {
    document.documentElement.className = `theme-${stageTheme}`;
    document.body.className = `theme-${stageTheme}`;
    localStorage.setItem('stagechord_theme', stageTheme);
  }, [stageTheme]);

  useEffect(() => {
    const rgb = hexToRgbChannels(chordColor);
    document.documentElement.style.setProperty('--color-stage-accent', rgb);
    document.body.style.setProperty('--color-stage-accent', rgb);
    localStorage.setItem('stagechord_chord_color', chordColor);
  }, [chordColor]);

  useEffect(() => {
    localStorage.setItem('stagechord_prefer_flats', preferFlats.toString());
  }, [preferFlats]);

  // Active Song Record from DB
  const activeSong = useMemo(() => {
    return songs.find((s) => s.id === activeSongId) || null;
  }, [songs, activeSongId]);

  // Reset Transposition when song changes
  useEffect(() => {
    if (activeSong) {
      setSemitones(0);
      setCurrentCapo(activeSong.capo || 0);
    }
  }, [activeSongId]);

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

  // Auto-scroll logic
  useEffect(() => {
    if (!isAutoScrolling) return;

    const interval = setInterval(() => {
      const el = viewerScrollContainerRef.current;
      if (el) {
        el.scrollTop += 1;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
          setIsAutoScrolling(false);
        }
      }
    }, Math.max(100 - (scrollSpeedBpm / 2), 20));

    return () => clearInterval(interval);
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
        onOpenSetlistEditor={() => setIsSetlistEditorOpen(true)}
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
          onToggleFavorite={() => handleToggleFavorite()}
        />

        {/* Musician Transpose & Auto-Fit Toolbar */}
        {activeSong && parsedTransposedSong && (
          <TransposeBar
            currentKey={parsedTransposedSong.metadata.key}
            originalKey={activeSong.key}
            semitones={semitones}
            capo={currentCapo}
            onTranspose={handleTranspose}
            onResetTranspose={handleResetTranspose}
            onSelectKey={handleSelectKey}
            onCapoChange={setCurrentCapo}
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
            onEnterStageMode={() => setIsStageMode(true)}
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
              themeStyle={stageTheme as any}
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
      />
    </div>
  );
}

export default App;
