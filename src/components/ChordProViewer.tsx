import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { ParsedSong, SongSection, SongLine, ChordToken } from '../lib/chordParser';
import { computeAutoFit } from '../lib/autoFit';

interface ChordProViewerProps {
  song: ParsedSong;
  capo?: number;
  zoomLevel: number;
  columnsPreference: 'auto' | 1 | 2 | 3;
  isAutoFit: boolean;
  isAutoScrolling?: boolean;
  themeStyle?: string;
  chordColor?: string;
  onChordClick?: (chord: string) => void;
}

export const ChordProViewer: React.FC<ChordProViewerProps> = ({
  song,
  capo = 0,
  zoomLevel,
  columnsPreference,
  isAutoFit,
  isAutoScrolling = false,
  chordColor,
  onChordClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Measure container dimensions for dynamic auto-fit
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Total lines calculation for auto-fit sizing
  const totalLineCount = useMemo(() => {
    let count = 0;
    for (const sec of song.sections) {
      count += 2; // header allowance
      count += sec.lines.length;
    }
    return Math.max(count, 10);
  }, [song]);

  // Compute 1-screen auto-fit parameters
  const fitResult = useMemo(() => {
    return computeAutoFit({
      containerWidth: dimensions.width,
      containerHeight: dimensions.height,
      totalLines: totalLineCount,
      totalSections: song.sections.length,
      preferredColumns: columnsPreference,
      userZoomLevel: zoomLevel,
    });
  }, [dimensions, totalLineCount, song.sections.length, columnsPreference, zoomLevel]);

  const activeColumns = columnsPreference === 'auto' ? fitResult.columns : columnsPreference;
  const activeFontSize = isAutoFit ? `${fitResult.fontSizeRem}rem` : `${1.0 * zoomLevel}rem`;

  return (
    <div
      ref={containerRef}
      className={`chordpro-scroll-surface w-full h-full p-3 sm:p-5 flex flex-col select-text transition-colors duration-150 ${
        isAutoFit && !isAutoScrolling ? 'overflow-hidden' : 'overflow-y-auto'
      }`}
      style={{ fontSize: activeFontSize }}
    >
      {/* Header Info Block */}
      <div className="flex-shrink-0 mb-3 border-b border-stage-border/60 pb-2.5 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-stage-text flex items-center gap-2">
            {song.metadata.title}
          </h1>
          {song.metadata.artist && (
            <p className="text-xs sm:text-sm font-medium text-stage-muted mt-0.5">
              {song.metadata.artist}
            </p>
          )}
        </div>

        {/* Badges: Key, Capo, Tempo, Time */}
        <div className="flex items-center gap-2 flex-wrap">
          {song.metadata.key && (
            <span 
              className="px-2.5 py-0.5 rounded-md bg-stage-cardHover border border-stage-border font-mono text-xs font-bold shadow-sm"
              style={{ color: chordColor || 'rgb(var(--color-stage-accent))' }}
            >
              Key: {song.metadata.key}
            </span>
          )}
          {((song.metadata.capo !== undefined ? song.metadata.capo : (capo || 0)) > 0) && (
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/35 text-amber-600 dark:text-amber-300 font-mono text-xs font-bold shadow-xs">
              🎸 Capo {song.metadata.capo !== undefined ? song.metadata.capo : capo}
            </span>
          )}
          {song.metadata.tempo && (
            <span className="px-2 py-0.5 rounded-md bg-stage-cardHover border border-stage-border text-stage-muted font-mono text-xs">
              {song.metadata.tempo} BPM
            </span>
          )}
          {song.metadata.time && (
            <span className="px-2 py-0.5 rounded-md bg-stage-cardHover border border-stage-border text-stage-muted font-mono text-xs">
              {song.metadata.time}
            </span>
          )}
        </div>
      </div>

      {/* Multi-Column Song Sections Container */}
      <div
        className="flex-1 w-full"
        style={{
          columnCount: activeColumns,
          columnGap: '2.0rem',
          columnFill: 'auto',
          height: isAutoFit ? 'calc(100% - 50px)' : 'auto',
        }}
      >
        {song.sections.map((section, secIdx) => (
          <SectionView
            key={`sec-${secIdx}`}
            section={section}
            chordColor={chordColor}
            onChordClick={onChordClick}
          />
        ))}
      </div>
    </div>
  );
};

const SectionView: React.FC<{
  section: SongSection;
  chordColor?: string;
  onChordClick?: (chord: string) => void;
}> = ({ section, chordColor, onChordClick }) => {
  const isChorus = section.type === 'chorus';
  const isBridge = section.type === 'bridge';

  return (
    <div
      className={`break-inside-avoid mb-4 rounded-xl transition-all ${
        isChorus
          ? 'bg-stage-card/70 border-l-4 pl-3.5 pr-2 py-2.5 border-t border-r border-b border-stage-border/30'
          : isBridge
          ? 'bg-stage-card/40 border-l-4 border-l-amber-500 pl-3.5 pr-2 py-2 border-t border-r border-b border-stage-border/20'
          : 'pl-1 py-1'
      }`}
      style={isChorus ? { borderLeftColor: chordColor || 'rgb(var(--color-stage-accent))' } : undefined}
    >
      {/* Section Title Header */}
      {section.title && (
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className={`text-[0.75em] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md font-mono ${
              isBridge
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : !isChorus
                ? 'bg-stage-border/70 text-stage-muted border border-stage-border'
                : 'text-slate-950 shadow-sm'
            }`}
            style={isChorus ? { backgroundColor: chordColor || 'rgb(var(--color-stage-accent))', color: '#090d16' } : undefined}
          >
            {section.title}
          </span>
        </div>
      )}

      {/* Section Lines */}
      <div className="space-y-2">
        {section.lines.map((line, lIdx) => (
          <LineView
            key={`line-${lIdx}`}
            line={line}
            chordColor={chordColor}
            onChordClick={onChordClick}
          />
        ))}
      </div>
    </div>
  );
};

const LineView: React.FC<{
  line: SongLine;
  chordColor?: string;
  onChordClick?: (chord: string) => void;
}> = ({ line, chordColor, onChordClick }) => {
  if (line.type === 'comment') {
    return (
      <div className="my-1.5 px-2.5 py-1 rounded bg-amber-500/10 border-l-2 border-amber-500 text-amber-800 dark:text-amber-200 font-semibold text-[0.85em] font-mono italic">
        💡 {line.commentText}
      </div>
    );
  }

  if (line.type === 'empty') {
    return <div className="h-2" />;
  }

  return (
    <div className="flex flex-wrap items-end leading-tight tracking-normal font-sans group">
      {line.tokens?.map((token, tIdx) => (
        <TokenView
          key={`tok-${tIdx}`}
          token={token}
          chordColor={chordColor}
          onChordClick={onChordClick}
        />
      ))}
    </div>
  );
};

const TokenView: React.FC<{
  token: ChordToken;
  chordColor?: string;
  onChordClick?: (chord: string) => void;
}> = ({ token, chordColor, onChordClick }) => {
  const hasChord = Boolean(token.chord && token.chord.trim().length > 0);

  return (
    <div className="inline-flex flex-col items-start min-w-[0.5em] align-top mr-[0.15em] relative">
      {/* Chord Line (Above Lyrics) */}
      <div className="min-h-[1.25em] flex items-center">
        {hasChord ? (
          <button
            onClick={() => token.chord && onChordClick?.(token.chord)}
            type="button"
            className="font-mono font-black text-[0.95em] tracking-tight hover:opacity-80 hover:underline cursor-pointer select-none whitespace-nowrap px-0.5 rounded transition-colors"
            style={{ color: chordColor || 'rgb(var(--color-stage-accent))' }}
            title={`Chord: ${token.chord}`}
          >
            {token.chord}
          </button>
        ) : (
          <span className="invisible text-[0.95em] font-mono select-none">&nbsp;</span>
        )}
      </div>

      {/* Lyric Line (Below Chords) */}
      <div className="text-stage-text whitespace-pre text-[1.0em] font-medium leading-tight">
        {token.lyric || '\u00A0'}
      </div>
    </div>
  );
};
