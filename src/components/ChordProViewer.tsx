import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import type { ParsedSong, SongSection, SongLine, ChordToken } from '../lib/chordParser';

interface ChordProViewerProps {
  song: ParsedSong;
  capo?: number;
  zoomLevel: number;
  // 'auto' measures the rendered song and fits it on one screen; 1 is a plain scrolling column
  columnsPreference: 'auto' | 1;
  isAutoScrolling?: boolean;
  themeStyle?: string;
  chordColor?: string;
  onChordClick?: (chord: string) => void;
}

const MIN_FIT_REM = 0.5;
const FIT_STEP_REM = 0.05;
const MAX_COLUMNS = 3;
const MIN_COLUMN_WIDTH_PX = 280;

export const ChordProViewer: React.FC<ChordProViewerProps> = ({
  song,
  capo = 0,
  zoomLevel,
  columnsPreference,
  isAutoScrolling = false,
  chordColor,
  onChordClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [fit, setFit] = useState<{ columns: number; fontRem: number } | null>(null);

  // Re-run the fit whenever the container is resized
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Measurement-based fit: try the largest font first and the fewest columns, and keep the
  // first combination whose real rendered height fits the space below the header.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (columnsPreference !== 'auto' || isAutoScrolling || !container || !content) {
      setFit(null);
      return;
    }

    const prevFontSize = container.style.fontSize;
    const prevCount = content.style.columnCount;
    const prevPad = content.style.paddingBottom;
    content.style.paddingBottom = '0';

    const bottomPad = parseFloat(getComputedStyle(container).paddingBottom) || 0;
    const maxColumns = Math.max(1, Math.min(MAX_COLUMNS, Math.floor(container.clientWidth / MIN_COLUMN_WIDTH_PX)));
    const maxRem = 1.4 * zoomLevel;

    let best: { columns: number; fontRem: number } | null = null;
    search: for (let rem = maxRem; rem >= MIN_FIT_REM - 1e-6; rem -= FIT_STEP_REM) {
      container.style.fontSize = `${rem}rem`;
      for (let cols = 1; cols <= maxColumns; cols++) {
        content.style.columnCount = String(cols);
        const available = container.clientHeight - content.offsetTop - bottomPad;
        const fitsHeight = content.getBoundingClientRect().height <= available + 0.5;
        const fitsWidth = content.scrollWidth <= content.clientWidth + 1;
        if (fitsHeight && fitsWidth) {
          best = { columns: cols, fontRem: Number(rem.toFixed(2)) };
          break search;
        }
      }
    }

    container.style.fontSize = prevFontSize;
    content.style.columnCount = prevCount;
    content.style.paddingBottom = prevPad;

    setFit((prev) =>
      prev && best && prev.columns === best.columns && prev.fontRem === best.fontRem ? prev : best
    );
  }, [song, zoomLevel, columnsPreference, isAutoScrolling, dimensions]);

  // Scroll to top whenever the song changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [song.metadata.title, song.metadata.key]);

  // Auto that fits -> fixed one-screen layout; otherwise (1 Col, auto-scrolling, or too long) -> scrolling column
  const fitted = columnsPreference === 'auto' && !isAutoScrolling ? fit : null;
  const activeColumns = fitted ? fitted.columns : 1;
  const activeFontSize = fitted ? `${fitted.fontRem}rem` : `${zoomLevel}rem`;

  return (
    <div
      ref={containerRef}
      className={`chordpro-scroll-surface relative w-full h-full p-3 sm:p-5 flex flex-col select-text transition-colors duration-150 ${
        fitted ? 'overflow-hidden' : 'overflow-y-auto'
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
        ref={contentRef}
        className={`w-full ${fitted ? '' : 'pb-36'}`}
        style={{
          columnCount: activeColumns,
          columnGap: '1.75rem',
          columnFill: 'balance',
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
      className={`break-inside-avoid mb-[1em] rounded-xl ${
        isChorus
          ? 'bg-stage-card/70 border-l-4 pl-[0.9em] pr-[0.5em] py-[0.6em] border-t border-r border-b border-stage-border/30'
          : isBridge
          ? 'bg-stage-card/40 border-l-4 border-l-amber-500 pl-[0.9em] pr-[0.5em] py-[0.5em] border-t border-r border-b border-stage-border/20'
          : 'pl-[0.25em] py-[0.25em]'
      }`}
      style={isChorus ? { borderLeftColor: chordColor || 'rgb(var(--color-stage-accent))' } : undefined}
    >
      {/* Section Title Header */}
      {section.title && (
        <div className="mb-[0.5em] flex items-center gap-1.5">
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
      <div className="space-y-[0.5em]">
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
      <div className="my-[0.4em] px-[0.6em] py-[0.25em] rounded bg-amber-500/10 border-l-2 border-amber-500 text-amber-800 dark:text-amber-200 font-semibold text-[0.85em] font-mono italic">
        💡 {line.commentText}
      </div>
    );
  }

  if (line.type === 'empty') {
    return <div className="h-[0.5em]" />;
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
