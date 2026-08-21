import React from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Maximize2, 
  Play, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  Edit3
} from 'lucide-react';
import { ROOT_NOTES_SHARP, ROOT_NOTES_FLAT } from '../lib/chordTransposer';

interface TransposeBarProps {
  currentKey?: string;
  originalKey?: string;
  semitones: number;
  capo?: number;
  onTranspose: (delta: number) => void;
  onResetTranspose: () => void;
  onSelectKey: (targetKey: string) => void;
  onCapoChange: (capo: number) => void;
  zoomLevel: number;
  onZoomChange: (delta: number) => void;
  columns: 'auto' | 1 | 2 | 3;
  onColumnsChange: (cols: 'auto' | 1 | 2 | 3) => void;
  isAutoFit: boolean;
  onToggleAutoFit: () => void;
  isAutoScrolling: boolean;
  onToggleAutoScroll: () => void;
  scrollSpeedBpm: number;
  onScrollSpeedChange: (speed: number) => void;
  onEnterStageMode: () => void;
  onEditSong: () => void;
  preferFlats: boolean;
  onTogglePreferFlats: () => void;
}

export const TransposeBar: React.FC<TransposeBarProps> = ({
  currentKey,
  originalKey,
  semitones,
  capo = 0,
  onTranspose,
  onResetTranspose,
  onSelectKey,
  onCapoChange,
  zoomLevel,
  onZoomChange,
  columns,
  onColumnsChange,
  isAutoFit,
  onToggleAutoFit,
  isAutoScrolling,
  onToggleAutoScroll,
  onEnterStageMode,
  onEditSong,
  preferFlats,
  onTogglePreferFlats,
}) => {
  const rootKeys = preferFlats ? ROOT_NOTES_FLAT : ROOT_NOTES_SHARP;

  return (
    <div className="bg-stage-card/90 backdrop-blur-md border-b border-stage-border px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-lg sticky top-0 z-30 transition-all">
      {/* Transpose & Key Section */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-semibold text-stage-muted uppercase tracking-wider hidden sm:inline mr-1">
          Key
        </span>

        {/* Transpose Down -1 */}
        <button
          onClick={() => onTranspose(-1)}
          className="flex items-center justify-center h-8 px-2.5 rounded-lg bg-stage-border/60 hover:bg-stage-cardHover text-stage-text active:scale-95 transition font-mono font-bold text-sm border border-stage-border"
          title="Transpose Down 1 Semitone (-1)"
        >
          <ChevronDown className="w-4 h-4 mr-0.5 text-stage-accent" />
          -1
        </button>

        {/* Current Key Indicator & Dropdown */}
        <div className="relative inline-block">
          <select
            value={currentKey || 'C'}
            onChange={(e) => onSelectKey(e.target.value)}
            className="h-8 pl-3 pr-7 rounded-lg bg-stage-cardHover border border-stage-accent/40 text-stage-accent font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-stage-accent appearance-none cursor-pointer"
          >
            {rootKeys.map((k) => (
              <option key={k} value={k}>
                Key: {k}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-stage-accent/70">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Transpose Up +1 */}
        <button
          onClick={() => onTranspose(1)}
          className="flex items-center justify-center h-8 px-2.5 rounded-lg bg-stage-border/60 hover:bg-stage-cardHover text-stage-text active:scale-95 transition font-mono font-bold text-sm border border-stage-border"
          title="Transpose Up 1 Semitone (+1)"
        >
          +1
          <ChevronUp className="w-4 h-4 ml-0.5 text-stage-accent" />
        </button>

        {/* Reset Transpose Button */}
        {semitones !== 0 ? (
          <button
            onClick={onResetTranspose}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-amber-500/25 text-amber-300 hover:bg-amber-500/40 text-xs font-mono font-bold transition border border-amber-400/60 shadow-sm animate-pulse"
            title={`Reset transposition back to original ${originalKey ? `(${originalKey})` : ''}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset {semitones > 0 ? `(+${semitones})` : `(${semitones})`}</span>
          </button>
        ) : originalKey ? (
          <span 
            onClick={onResetTranspose}
            className="text-[11px] font-mono text-stage-muted px-1.5 py-1 rounded bg-stage-cardHover/40 border border-stage-border/40 hidden sm:inline"
            title="Current key matches original chart"
          >
            Orig: {originalKey}
          </span>
        ) : null}

        {/* Flats vs Sharps toggle */}
        <button
          onClick={onTogglePreferFlats}
          className="h-8 px-2 rounded-lg bg-stage-border/40 hover:bg-stage-cardHover text-xs font-mono text-stage-muted hover:text-stage-text transition border border-stage-border"
          title="Toggle Enharmonic (# vs ♭)"
        >
          {preferFlats ? '♭ Flats' : '# Sharps'}
        </button>

        {/* Capo Selector */}
        <div className="flex items-center gap-1 bg-stage-cardHover/60 px-2 py-0.5 rounded-lg border border-stage-border">
          <span className="text-xs text-stage-muted font-medium">Capo:</span>
          <select
            value={capo}
            onChange={(e) => onCapoChange(Number(e.target.value))}
            className="bg-transparent text-xs font-mono font-bold text-stage-text focus:outline-none cursor-pointer"
          >
            <option value={0}>None</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((fret) => (
              <option key={fret} value={fret}>
                Fret {fret}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* View Options: 1-Screen Auto-Fit, Columns, Zoom, Stage Mode */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* 1-Screen AutoFit Toggle Button */}
        <button
          onClick={onToggleAutoFit}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition shadow-sm ${
            isAutoFit
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20 font-bold ring-1 ring-emerald-400'
              : 'bg-stage-border/60 hover:bg-stage-cardHover text-stage-muted border border-stage-border'
          }`}
          title="Render song to fit on one screen without scrolling"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAutoFit ? 'text-white animate-pulse' : 'text-stage-accent'}`} />
          <span>Fit 1-Screen</span>
        </button>

        {/* Columns Dropdown / Toggle */}
        <div className="flex items-center bg-stage-cardHover rounded-lg border border-stage-border p-0.5">
          <button
            onClick={() => onColumnsChange('auto')}
            className={`px-2 py-1 text-xs font-medium rounded ${
              columns === 'auto' ? 'bg-stage-accent text-slate-950 font-bold shadow' : 'text-stage-muted hover:text-stage-text'
            }`}
            title="Auto-detect columns based on screen size"
          >
            Auto
          </button>
          <button
            onClick={() => onColumnsChange(1)}
            className={`px-2 py-1 text-xs font-medium rounded ${
              columns === 1 ? 'bg-stage-accent text-slate-950 font-bold shadow' : 'text-stage-muted hover:text-stage-text'
            }`}
            title="Single Column Layout"
          >
            1 Col
          </button>
          <button
            onClick={() => onColumnsChange(2)}
            className={`px-2 py-1 text-xs font-medium rounded ${
              columns === 2 ? 'bg-stage-accent text-slate-950 font-bold shadow' : 'text-stage-muted hover:text-stage-text'
            }`}
            title="Two Columns Layout"
          >
            2 Cols
          </button>
          <button
            onClick={() => onColumnsChange(3)}
            className={`px-2 py-1 text-xs font-medium rounded hidden md:inline ${
              columns === 3 ? 'bg-stage-accent text-slate-950 font-bold shadow' : 'text-stage-muted hover:text-stage-text'
            }`}
            title="Three Columns Layout"
          >
            3 Cols
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-stage-cardHover rounded-lg border border-stage-border">
          <button
            onClick={() => onZoomChange(-0.1)}
            disabled={zoomLevel <= 0.6}
            className="p-1.5 text-stage-muted hover:text-stage-text disabled:opacity-30 transition"
            title="Decrease Font Size"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-medium px-1 text-stage-muted">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(0.1)}
            disabled={zoomLevel >= 1.8}
            className="p-1.5 text-stage-muted hover:text-stage-text disabled:opacity-30 transition"
            title="Increase Font Size"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auto-Scroll Toggle */}
        <button
          onClick={onToggleAutoScroll}
          className={`flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold transition border ${
            isAutoScrolling
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              : 'bg-stage-border/60 hover:bg-stage-cardHover text-stage-muted border-stage-border'
          }`}
          title="Toggle Auto-Scroll"
        >
          {isAutoScrolling ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span className="hidden sm:inline">Scroll</span>
        </button>

        {/* Edit Song Button */}
        <button
          onClick={onEditSong}
          className="h-8 px-2.5 rounded-lg bg-stage-border/60 hover:bg-stage-cardHover text-stage-muted hover:text-stage-text text-xs font-medium transition border border-stage-border flex items-center gap-1"
          title="Edit ChordPro Source"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </button>

        {/* Live Stage Mode Button */}
        <button
          onClick={onEnterStageMode}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition"
          title="Enter Fullscreen Stage Performance Mode"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Stage Mode</span>
        </button>
      </div>
    </div>
  );
};
