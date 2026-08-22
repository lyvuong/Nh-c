import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Edit3, 
  X, 
  Check, 
  Trash2, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { parseChordPro, type ParsedSong } from '../lib/chordParser';
import { ChordProViewer } from './ChordProViewer';
import type { DBSong } from '../lib/db';

interface SongEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  song?: DBSong | null;
  onSaveSong: (song: Omit<DBSong, 'id'>, id?: number) => Promise<void>;
  onDeleteSong?: (id: number) => Promise<void>;
}

const DEFAULT_NEW_SONG_TEMPLATE = `{title: New Song}
{artist: Band / Artist}
{key: G}
{tempo: 120}
{time: 4/4}

{comment: Intro}
[G]   [Em]   [C]   [D]

{start_of_verse}
[G]First line of the [Em]verse goes here
[C]Chords right above the [D]lyrics appear
{end_of_verse}

{start_of_chorus}
[G]This is the chorus [C]sing it loud
[D]Play it together with the [G]crowd
{end_of_chorus}`;

export const SongEditorModal: React.FC<SongEditorModalProps> = ({
  isOpen,
  onClose,
  song,
  onSaveSong,
  onDeleteSong,
}) => {
  const [content, setContent] = useState<string>(
    song?.content || DEFAULT_NEW_SONG_TEMPLATE
  );

  // Sync content whenever song or modal open state changes
  useEffect(() => {
    if (isOpen) {
      setContent(song?.content || DEFAULT_NEW_SONG_TEMPLATE);
    }
  }, [song, isOpen]);

  const [activeTab, setActiveTab] = useState<'split' | 'edit' | 'preview'>('split');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Live parsed preview
  const parsedPreview = useMemo<ParsedSong>(() => {
    return parseChordPro(content);
  }, [content]);

  // Insert helper snippet into textarea at current cursor position
  const insertSnippet = (snippet: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const nextContent =
      content.substring(0, start) + snippet + content.substring(end);
    setContent(nextContent);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          start + snippet.length,
          start + snippet.length
        );
      }
    }, 50);
  };

  const handleSave = async () => {
    const meta = parsedPreview.metadata;
    await onSaveSong(
      {
        title: meta.title || song?.title || 'Untitled Song',
        artist: meta.artist || song?.artist || '',
        key: meta.key || song?.key || 'C',
        originalKey: meta.key || song?.originalKey || 'C',
        capo: meta.capo !== undefined ? meta.capo : (song?.capo || 0),
        tempo: meta.tempo || '',
        timeSignature: meta.time || '4/4',
        content: content,
        folderName: song?.folderName || 'General',
        fileName: song?.fileName || `${meta.title || 'song'}.cho`,
        createdAt: song?.createdAt || Date.now(),
        updatedAt: Date.now(),
        isFavorite: song?.isFavorite || false,
      },
      song?.id
    );
    onClose();
  };

  const handleDelete = async () => {
    if (song?.id && onDeleteSong) {
      if (confirm(`Are you sure you want to delete "${song.title}"?`)) {
        await onDeleteSong(song.id);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-stage-card border border-stage-border rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-3.5 border-b border-stage-border flex items-center justify-between gap-3 bg-stage-bg/60">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 flex-shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="font-extrabold text-sm sm:text-base text-stage-text truncate">
                {song ? `Edit: ${song.title}` : 'Create New ChordPro Song'}
              </h3>
              <p className="text-[11px] text-stage-muted truncate">
                Edit chords in brackets e.g. [G], directives e.g. &#123;title: ...&#125;, &#123;key: ...&#125;
              </p>
            </div>
          </div>

          {/* View Tabs on Mobile */}
          <div className="flex items-center gap-2">
            <div className="flex bg-stage-cardHover rounded-lg p-0.5 border border-stage-border md:hidden">
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  activeTab === 'edit'
                    ? 'bg-stage-accent text-slate-950 shadow'
                    : 'text-stage-muted'
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  activeTab === 'preview'
                    ? 'bg-stage-accent text-slate-950 shadow'
                    : 'text-stage-muted'
                }`}
              >
                Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stage-cardHover text-stage-muted hover:text-stage-text"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Insert Snippet Toolbar */}
        <div className="px-3.5 py-2 bg-stage-bg border-b border-stage-border/70 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[11px] font-mono text-stage-muted font-bold mr-1 flex-shrink-0">
            Quick Insert:
          </span>
          <button
            onClick={() => insertSnippet('{title: Song Title}')}
            className="px-2 py-1 rounded bg-stage-cardHover hover:bg-stage-border text-cyan-300 font-mono border border-stage-border transition flex-shrink-0"
          >
            &#123;title&#125;
          </button>
          <button
            onClick={() => insertSnippet('{artist: Artist Name}')}
            className="px-2 py-1 rounded bg-stage-cardHover hover:bg-stage-border text-cyan-300 font-mono border border-stage-border transition flex-shrink-0"
          >
            &#123;artist&#125;
          </button>
          <button
            onClick={() => insertSnippet('[G]')}
            className="px-2 py-1 rounded bg-stage-cardHover hover:bg-stage-border text-stage-accent font-mono font-bold border border-stage-border transition flex-shrink-0"
          >
            [Chord]
          </button>
          <button
            onClick={() => insertSnippet('{start_of_chorus}\n\n{end_of_chorus}')}
            className="px-2 py-1 rounded bg-stage-cardHover hover:bg-stage-border text-stage-text font-mono border border-stage-border transition flex-shrink-0"
          >
            &#123;soc&#125; Chorus
          </button>
          <button
            onClick={() => insertSnippet('{start_of_verse}\n\n{end_of_verse}')}
            className="px-2 py-1 rounded bg-stage-cardHover hover:bg-stage-border text-stage-text font-mono border border-stage-border transition flex-shrink-0"
          >
            &#123;sov&#125; Verse
          </button>
          <button
            onClick={() => insertSnippet('{start_of_bridge}\n\n{end_of_bridge}')}
            className="px-2 py-1 rounded bg-stage-cardHover hover:bg-stage-border text-amber-300 font-mono border border-stage-border transition flex-shrink-0"
          >
            &#123;sob&#125; Bridge
          </button>
          <button
            onClick={() => insertSnippet('{comment: Guitar Solo}')}
            className="px-2 py-1 rounded bg-stage-cardHover hover:bg-stage-border text-amber-300 font-mono border border-stage-border transition flex-shrink-0"
          >
            &#123;comment&#125;
          </button>
          <button
            onClick={() => insertSnippet('{key: Am}')}
            className="px-2 py-1 rounded bg-stage-cardHover hover:bg-stage-border text-stage-muted hover:text-stage-text font-mono border border-stage-border transition flex-shrink-0"
          >
            &#123;key&#125;
          </button>
          <button
            onClick={() => insertSnippet('{tempo: 120}')}
            className="px-2 py-1 rounded bg-stage-cardHover hover:bg-stage-border text-stage-muted hover:text-stage-text font-mono border border-stage-border transition flex-shrink-0"
          >
            &#123;tempo&#125;
          </button>
          <button
            onClick={() => setContent(song?.content || DEFAULT_NEW_SONG_TEMPLATE)}
            className="px-2 py-1 rounded bg-stage-cardHover hover:bg-stage-border text-slate-400 hover:text-slate-200 font-mono border border-stage-border transition flex-shrink-0 ml-auto flex items-center gap-1"
            title="Reset to original content before edits"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Edits</span>
          </button>
        </div>

        {/* Editor Split View */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stage-border">
          {/* Left Editor */}
          <div
            className={`h-full flex flex-col bg-stage-bg ${
              activeTab === 'preview' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-2 px-3 border-b border-stage-border/60 bg-stage-card/50 flex items-center justify-between text-[11px] font-mono text-stage-muted">
              <span>ChordPro Source (Type directly to edit chords & lyrics)</span>
              <span className="text-stage-accent font-semibold">{content.length} characters</span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full p-4 bg-transparent font-mono text-xs sm:text-sm text-stage-text placeholder:text-stage-muted focus:outline-none resize-none leading-relaxed selection:bg-cyan-500/30"
              placeholder="Type or paste ChordPro text here..."
              spellCheck={false}
            />
          </div>

          {/* Right Live Formatted Preview */}
          <div
            className={`h-full flex flex-col bg-stage-card overflow-hidden ${
              activeTab === 'edit' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-2 px-3 border-b border-stage-border/60 bg-stage-bg/80 flex items-center justify-between text-[11px] font-mono text-stage-muted">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Live Render Preview
              </span>
              <span>1-Screen Layout</span>
            </div>
            <div className="flex-1 overflow-hidden p-2">
              <ChordProViewer
                song={parsedPreview}
                zoomLevel={0.9}
                columnsPreference="auto"
                isAutoFit={true}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-stage-border bg-stage-bg/50 flex items-center justify-between">
          <div>
            {song?.id && onDeleteSong && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Song</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stage-muted hover:text-stage-text transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{song?.id ? 'Update & Save Song' : 'Create & Save Song'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
