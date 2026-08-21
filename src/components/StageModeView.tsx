import React, { useEffect, useState } from 'react';
import { 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  Lock,
  RotateCcw
} from 'lucide-react';
import type { ParsedSong } from '../lib/chordParser';
import { ChordProViewer } from './ChordProViewer';
import { requestWakeLock, releaseWakeLock } from '../lib/wakeLock';

interface StageModeViewProps {
  currentSong: ParsedSong;
  songIndex: number;
  totalSongs: number;
  setlistName?: string;
  nextSongTitle?: string;
  previousSongTitle?: string;
  onNextSong: () => void;
  onPrevSong: () => void;
  onExitStageMode: () => void;
  semitones: number;
  onTranspose: (delta: number) => void;
  onResetTranspose: () => void;
  capo?: number;
  zoomLevel: number;
  onZoomChange: (delta: number) => void;
}

export const StageModeView: React.FC<StageModeViewProps> = ({
  currentSong,
  songIndex,
  totalSongs,
  setlistName = 'All Songs',
  nextSongTitle,
  previousSongTitle,
  onNextSong,
  onPrevSong,
  onExitStageMode,
  semitones,
  onTranspose,
  onResetTranspose,
  capo = 0,
  zoomLevel,
}) => {
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const [tempoPulse, setTempoPulse] = useState(false);

  // Request Wake Lock to keep screen awake during live stage gig
  useEffect(() => {
    requestWakeLock().then((res) => setWakeLockEnabled(res));
    return () => {
      releaseWakeLock();
    };
  }, []);

  // Visual metronome pulse if tempo is specified
  useEffect(() => {
    const bpm = parseInt(currentSong.metadata.tempo || '0', 10);
    if (!bpm || bpm <= 30 || bpm >= 300) return;

    const intervalMs = (60 / bpm) * 1000;
    const timer = setInterval(() => {
      setTempoPulse(true);
      setTimeout(() => setTempoPulse(false), 120);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [currentSong.metadata.tempo]);

  // Bluetooth Pedal & Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onNextSong();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        e.preventDefault();
        onPrevSong();
      } else if (e.key === 'Escape') {
        onExitStageMode();
      } else if (e.key === '=' || e.key === '+') {
        onTranspose(1);
      } else if (e.key === '-') {
        onTranspose(-1);
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
        onResetTranspose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNextSong, onPrevSong, onExitStageMode, onTranspose, onResetTranspose]);

  return (
    <div className="fixed inset-0 z-50 bg-[#05070a] text-slate-100 flex flex-col select-none overflow-hidden font-sans">
      {/* Top Stage Bar */}
      <div className="flex-shrink-0 bg-[#0a0f18] border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-3">
        {/* Left: Setlist and Position */}
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
            {setlistName}
          </span>
          <span className="text-xs font-mono text-slate-400 font-semibold">
            Song {songIndex + 1} of {totalSongs}
          </span>
          {wakeLockEnabled && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <Lock className="w-3 h-3" /> Screen Lock On
            </span>
          )}
        </div>

        {/* Center: Tempo Visual Blinker */}
        {currentSong.metadata.tempo && (
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full transition-all duration-100 ${
                tempoPulse ? 'bg-cyan-400 scale-125 shadow-lg shadow-cyan-400' : 'bg-slate-700'
              }`}
            />
            <span className="text-xs font-mono text-slate-300 font-bold">
              {currentSong.metadata.tempo} BPM
            </span>
          </div>
        )}

        {/* Right: Quick Stage Controls & Exit */}
        <div className="flex items-center gap-2">
          {/* Quick Semitone Buttons with Reset */}
          <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 p-0.5">
            <button
              onClick={() => onTranspose(-1)}
              className="px-2 py-1 text-xs font-mono font-bold hover:text-cyan-400 text-slate-300 active:bg-slate-800 rounded"
              title="Transpose -1 Semitone"
            >
              -1
            </button>
            <span className="px-1 text-[11px] font-mono text-cyan-400 font-bold">
              {currentSong.metadata.key || 'Key'}
            </span>
            <button
              onClick={() => onTranspose(1)}
              className="px-2 py-1 text-xs font-mono font-bold hover:text-cyan-400 text-slate-300 active:bg-slate-800 rounded"
              title="Transpose +1 Semitone"
            >
              +1
            </button>
            {semitones !== 0 && (
              <button
                onClick={onResetTranspose}
                className="ml-1 px-1.5 py-1 text-[10px] font-mono font-bold bg-amber-500/30 text-amber-300 hover:bg-amber-500/40 active:scale-95 rounded flex items-center gap-0.5 border border-amber-400/50"
                title="Reset transpose to original key (press '0' or 'r')"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Orig</span>
              </button>
            )}
          </div>

          {/* Exit Fullscreen Stage */}
          <button
            onClick={onExitStageMode}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition"
            title="Exit Stage Mode (Esc)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Main Song Content (1-Screen Auto-Fit) */}
      <div className="flex-1 w-full overflow-hidden p-2 sm:p-4 bg-[#070a10]">
        <ChordProViewer
          song={currentSong}
          capo={capo}
          zoomLevel={zoomLevel}
          columnsPreference="auto"
          isAutoFit={true}
          themeStyle="oled-black"
        />
      </div>

      {/* Bottom Large Stage Footer for Pedal / Hands-Free Navigation */}
      <div className="flex-shrink-0 bg-[#0a0f18] border-t border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Previous Song Giant Target */}
        <button
          onClick={onPrevSong}
          disabled={songIndex <= 0}
          className="flex-1 max-w-xs h-12 flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 active:scale-98 transition border border-slate-700 font-bold text-sm text-slate-200"
        >
          <ChevronLeft className="w-5 h-5 text-cyan-400" />
          <div className="text-left truncate">
            <div className="text-[10px] uppercase font-mono text-slate-400">Previous (PgUp / Left)</div>
            <div className="text-xs truncate font-semibold">{previousSongTitle || 'First Song'}</div>
          </div>
        </button>

        {/* Central Pedal Reminder */}
        <div className="hidden md:flex flex-col items-center text-center text-slate-500 font-mono text-[11px]">
          <span>BT Pedal or Arrows to flip</span>
          <span className="text-slate-400 text-xs font-bold">1-Screen Fit (No Scrolling Needed)</span>
        </div>

        {/* Next Song Giant Target */}
        <button
          onClick={onNextSong}
          disabled={songIndex >= totalSongs - 1}
          className="flex-1 max-w-xs h-12 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 active:scale-98 transition text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-600/30"
        >
          <div className="text-right truncate">
            <div className="text-[10px] uppercase font-mono text-cyan-950">Next (PgDn / Right)</div>
            <div className="text-xs truncate font-bold">{nextSongTitle || 'End of Setlist'}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-950" />
        </button>
      </div>
    </div>
  );
};
