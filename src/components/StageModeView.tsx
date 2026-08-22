import React, { useEffect, useState, useRef } from 'react';
import { 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  RotateCcw,
  Play,
  Square,
  Minus,
  Plus,
  ZoomIn,
  ZoomOut,
  Sparkles
} from 'lucide-react';
import type { ParsedSong } from '../lib/chordParser';
import { ChordProViewer } from './ChordProViewer';
import { requestWakeLock, releaseWakeLock } from '../lib/wakeLock';
import { AutoScrollController } from './AutoScrollController';

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
  columnsPreference?: 'auto' | 1 | 2 | 3;
  onColumnsChange?: (cols: 'auto' | 1 | 2 | 3) => void;
  isAutoFit?: boolean;
  onToggleAutoFit?: () => void;
  isAutoScrolling?: boolean;
  onToggleAutoScroll?: () => void;
  scrollSpeedBpm?: number;
  onScrollSpeedChange?: (speed: number) => void;
  stageTheme?: string;
  chordColor?: string;
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
  onZoomChange,
  columnsPreference = 'auto',
  onColumnsChange,
  isAutoFit = true,
  onToggleAutoFit,
  isAutoScrolling = false,
  onToggleAutoScroll,
  scrollSpeedBpm = 80,
  onScrollSpeedChange,
  stageTheme,
  chordColor,
}) => {
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const [tempoPulse, setTempoPulse] = useState(false);
  const stageContainerRef = useRef<HTMLDivElement>(null);

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

  // Helper to accurately get the active Stage Mode scroll container
  const getStageScrollEl = () => {
    return (stageContainerRef.current?.querySelector('.chordpro-scroll-surface') ||
      document.querySelector('.stage-mode-view .chordpro-scroll-surface')) as HTMLElement | null;
  };

  // Smart Bluetooth Pedal & Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const scrollEl = getStageScrollEl();

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'Enter') {
        e.preventDefault();
        // If content is scrollable and not at bottom, scroll down first
        if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 10) {
          const isAtBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 30;
          if (!isAtBottom) {
            scrollEl.scrollBy({ top: scrollEl.clientHeight * 0.75, behavior: 'smooth' });
            return;
          }
        }
        onNextSong();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        e.preventDefault();
        if (scrollEl && scrollEl.scrollTop > 30) {
          scrollEl.scrollBy({ top: -scrollEl.clientHeight * 0.75, behavior: 'smooth' });
          return;
        }
        onPrevSong();
      } else if (e.key === ' ') {
        e.preventDefault();
        onToggleAutoScroll?.();
      } else if (e.key === 'Escape') {
        onExitStageMode();
      } else if (e.key === '=' || e.key === '+') {
        onTranspose(1);
      } else if (e.key === '-') {
        onTranspose(-1);
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
        onResetTranspose();
      } else if (e.key === ']' || e.key === '}') {
        onScrollSpeedChange?.(Math.min(240, scrollSpeedBpm + 5));
      } else if (e.key === '[' || e.key === '{') {
        onScrollSpeedChange?.(Math.max(10, scrollSpeedBpm - 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNextSong, onPrevSong, onExitStageMode, onTranspose, onResetTranspose, onToggleAutoScroll, onScrollSpeedChange, scrollSpeedBpm]);

  const handleRewindToTop = () => {
    const scrollEl = getStageScrollEl();
    if (scrollEl) scrollEl.scrollTop = 0;
  };

  return (
    <div 
      ref={stageContainerRef}
      className="stage-mode-view fixed inset-0 z-50 bg-stage-bg text-stage-text flex flex-col select-none overflow-hidden font-sans transition-colors duration-150"
    >
      {/* Top Stage Control Bar */}
      <div className="flex-shrink-0 bg-stage-card border-b border-stage-border px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shadow-md flex-wrap">
        
        {/* Left: Setlist and Position */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span 
            className="px-2.5 py-1 rounded-lg bg-stage-cardHover font-mono text-xs font-bold border border-stage-border truncate max-w-[140px] sm:max-w-none"
            style={{ color: chordColor || 'rgb(var(--color-stage-accent))' }}
          >
            {setlistName}
          </span>
          <span className="text-xs font-mono text-stage-muted font-semibold flex-shrink-0">
            Song {songIndex + 1} of {totalSongs}
          </span>
          {wakeLockEnabled && (
            <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <Lock className="w-3 h-3" /> Awake
            </span>
          )}
        </div>

        {/* Center: Tempo Visual Blinker */}
        {currentSong.metadata.tempo && (
          <div className="hidden sm:flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full transition-all duration-100 ${
                tempoPulse ? 'scale-125 shadow-lg' : 'opacity-40'
              }`}
              style={{ backgroundColor: chordColor || 'rgb(var(--color-stage-accent))' }}
            />
            <span className="text-xs font-mono text-stage-text font-bold">
              {currentSong.metadata.tempo} BPM
            </span>
          </div>
        )}

        {/* Right: Quick Stage Controls & Exit */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* Quick Columns Toggle */}
          {onColumnsChange && (
            <div className="hidden md:flex items-center bg-stage-cardHover rounded-lg border border-stage-border p-0.5 text-xs font-mono font-bold">
              {(['auto', 1, 2, 3] as const).map((col) => (
                <button
                  key={col}
                  onClick={() => onColumnsChange(col)}
                  className={`px-2 py-0.5 rounded transition ${
                    columnsPreference === col
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                      : 'text-stage-muted hover:text-stage-text'
                  }`}
                  title={`${col === 'auto' ? 'Auto Columns' : `${col} Column`}`}
                >
                  {col === 'auto' ? 'Auto' : `${col}C`}
                </button>
              ))}
            </div>
          )}

          {/* Auto-Fit Toggle */}
          {onToggleAutoFit && (
            <button
              onClick={onToggleAutoFit}
              className={`hidden sm:flex items-center gap-1 h-7 px-2 rounded-lg text-xs font-semibold border transition ${
                isAutoFit
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : 'bg-stage-cardHover text-stage-muted border-stage-border hover:text-stage-text'
              }`}
              title="Toggle 1-Screen Auto-Fit vs Multi-Page Scroll"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isAutoFit ? 'Fit' : 'Scroll'}</span>
            </button>
          )}

          {/* Quick Auto-Scroll Toggle & Stepper */}
          {onToggleAutoScroll && (
            <div className="flex items-center gap-1 bg-stage-bg rounded-lg border border-stage-border p-0.5">
              <button
                onClick={onToggleAutoScroll}
                className={`flex items-center gap-1 h-7 px-2 rounded-md text-xs font-semibold transition ${
                  isAutoScrolling
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : 'hover:bg-stage-cardHover text-stage-muted hover:text-stage-text'
                }`}
                title="Toggle Auto-Scroll (Space)"
              >
                {isAutoScrolling ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span className="hidden md:inline">{isAutoScrolling ? 'Stop' : 'Scroll'}</span>
              </button>

              {onScrollSpeedChange && (
                <div className="flex items-center gap-0.5 border-l border-stage-border/60 pl-1">
                  <button
                    onClick={() => onScrollSpeedChange(Math.max(10, scrollSpeedBpm - 5))}
                    className="p-1 hover:bg-stage-cardHover text-stage-muted hover:text-stage-text rounded transition"
                    title="Slow Down (-5 BPM)"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-mono font-bold text-stage-text">
                    {scrollSpeedBpm}
                  </span>
                  <button
                    onClick={() => onScrollSpeedChange(Math.min(240, scrollSpeedBpm + 5))}
                    className="p-1 hover:bg-stage-cardHover text-stage-muted hover:text-stage-text rounded transition"
                    title="Speed Up (+5 BPM)"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Font Zoom Controls */}
          <div className="hidden sm:flex items-center bg-stage-cardHover rounded-lg border border-stage-border p-0.5">
            <button
              onClick={() => onZoomChange(-0.1)}
              disabled={zoomLevel <= 0.6}
              className="p-1 text-stage-muted hover:text-stage-text disabled:opacity-30 transition"
              title="Decrease Font"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onZoomChange(0.1)}
              disabled={zoomLevel >= 1.8}
              className="p-1 text-stage-muted hover:text-stage-text disabled:opacity-30 transition"
              title="Increase Font"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Semitone Buttons with Reset */}
          <div className="flex items-center bg-stage-cardHover rounded-lg border border-stage-border p-0.5">
            <button
              onClick={() => onTranspose(-1)}
              className="px-2 py-1 text-xs font-mono font-bold hover:opacity-80 text-stage-text active:bg-stage-card rounded cursor-pointer"
              title="Transpose -1 Semitone"
            >
              -1
            </button>
            <span 
              className="px-1.5 py-0.5 text-xs font-mono font-black"
              style={{ color: chordColor || 'rgb(var(--color-stage-accent))' }}
            >
              {currentSong.metadata.key || 'Key'}
            </span>
            <button
              onClick={() => onTranspose(1)}
              className="px-2 py-1 text-xs font-mono font-bold hover:opacity-80 text-stage-text active:bg-stage-card rounded cursor-pointer"
              title="Transpose +1 Semitone"
            >
              +1
            </button>
            {semitones !== 0 && (
              <button
                onClick={onResetTranspose}
                className="ml-1 px-1.5 py-1 text-[10px] font-mono font-bold bg-amber-500/30 text-amber-300 hover:bg-amber-500/40 active:scale-95 rounded flex items-center gap-0.5 border border-amber-400/50 cursor-pointer"
                title="Reset transpose (0 or R)"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Orig</span>
              </button>
            )}
          </div>

          {/* Exit Fullscreen Stage */}
          <button
            onClick={onExitStageMode}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition cursor-pointer"
            title="Exit Stage Mode (Esc)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Main Song Content Surface */}
      <div className="flex-1 w-full overflow-hidden p-1 sm:p-3 bg-stage-bg flex flex-col">
        <ChordProViewer
          song={currentSong}
          capo={capo}
          zoomLevel={zoomLevel}
          columnsPreference={columnsPreference}
          isAutoFit={isAutoFit}
          isAutoScrolling={isAutoScrolling}
          themeStyle={stageTheme}
          chordColor={chordColor}
        />
      </div>

      {/* Floating Auto-Scroll Speed Controller HUD */}
      {isAutoScrolling && onToggleAutoScroll && onScrollSpeedChange && (
        <AutoScrollController
          isAutoScrolling={isAutoScrolling}
          onToggleAutoScroll={onToggleAutoScroll}
          scrollSpeedBpm={scrollSpeedBpm}
          onScrollSpeedChange={onScrollSpeedChange}
          onRewindToTop={handleRewindToTop}
        />
      )}

      {/* Bottom Large Stage Footer for Pedal / Hands-Free Navigation */}
      <div className="flex-shrink-0 bg-stage-card border-t border-stage-border px-4 py-2 flex items-center justify-between gap-4">
        {/* Previous Song Target */}
        <button
          onClick={onPrevSong}
          disabled={songIndex <= 0}
          className="flex-1 max-w-xs h-11 flex items-center justify-center gap-2 rounded-xl bg-stage-cardHover hover:bg-stage-border disabled:opacity-30 active:scale-98 transition border border-stage-border font-bold text-sm text-stage-text cursor-pointer"
        >
          <ChevronLeft 
            className="w-5 h-5"
            style={{ color: chordColor || 'rgb(var(--color-stage-accent))' }}
          />
          <div className="text-left truncate">
            <div className="text-[10px] uppercase font-mono text-stage-muted">Prev (PgUp / Left)</div>
            <div className="text-xs truncate font-semibold">{previousSongTitle || 'First Song'}</div>
          </div>
        </button>

        {/* Central Stage Reminder */}
        <div className="hidden md:flex flex-col items-center text-center text-stage-muted font-mono text-[11px]">
          <span>BT Pedal, Arrows, or Auto-Scroll</span>
          <span className="text-stage-text text-xs font-bold">1-Screen Fit & Full Page Coverage</span>
        </div>

        {/* Next Song Target */}
        <button
          onClick={onNextSong}
          disabled={songIndex >= totalSongs - 1}
          className="flex-1 max-w-xs h-11 flex items-center justify-center gap-2 rounded-xl disabled:opacity-30 active:scale-98 transition text-slate-950 font-extrabold text-sm shadow-lg cursor-pointer"
          style={{ backgroundColor: chordColor || 'rgb(var(--color-stage-accent))' }}
        >
          <div className="text-right truncate">
            <div className="text-[10px] uppercase font-mono opacity-80">Next (PgDn / Right)</div>
            <div className="text-xs truncate font-bold">{nextSongTitle || 'End of Setlist'}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-950" />
        </button>
      </div>
    </div>
  );
};
