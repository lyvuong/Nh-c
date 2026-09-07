import React, { useMemo, useState } from 'react';
import {
  ListMusic,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  Music,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';
import type { DBSong, DBSetlist, DBSetlistSong } from '../lib/db';

interface SetlistEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: DBSong[];
  setlists: DBSetlist[];
  activeSetlistId: number | null;
  onSaveSetlist: (setlist: Omit<DBSetlist, 'id'>, id?: number) => Promise<void>;
  onDeleteSetlist: (id: number) => Promise<void>;
  onSelectSetlist: (id: number | null) => void;
}

export const SetlistEditorModal: React.FC<SetlistEditorModalProps> = ({
  isOpen,
  onClose,
  songs,
  setlists,
  activeSetlistId,
  onSaveSetlist,
  onDeleteSetlist,
}) => {
  const [selectedSetlistId, setSelectedSetlistId] = useState<number | 'new'>(
    activeSetlistId || (setlists.length > 0 ? setlists[0].id! : 'new')
  );

  const currentSetlist = setlists.find((s) => s.id === selectedSetlistId);

  const [name, setName] = useState(currentSetlist?.name || 'New Gig Setlist');
  const [gigDate, setGigDate] = useState(currentSetlist?.gigDate || '');
  const [description, setDescription] = useState(currentSetlist?.description || '');
  const [setlistSongs, setSetlistSongs] = useState<DBSetlistSong[]>(
    currentSetlist?.songs || []
  );

  // Add Songs picker state
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addKeyFilter, setAddKeyFilter] = useState('ALL');
  const [selectedToAdd, setSelectedToAdd] = useState<Set<number>>(new Set());

  // Switch setlist
  const handleSelectSetlist = (id: number | 'new') => {
    setSelectedSetlistId(id);
    setAddSearchQuery('');
    setAddKeyFilter('ALL');
    setSelectedToAdd(new Set());
    if (id === 'new') {
      setName(`Gig Setlist ${setlists.length + 1}`);
      setGigDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setSetlistSongs([]);
    } else {
      const found = setlists.find((s) => s.id === id);
      if (found) {
        setName(found.name);
        setGigDate(found.gigDate || '');
        setDescription(found.description || '');
        setSetlistSongs([...found.songs]);
      }
    }
  };

  const existingSongIds = useMemo(
    () => new Set(setlistSongs.map((item) => item.songId)),
    [setlistSongs]
  );

  const availableKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const s of songs) {
      if (s.key) keys.add(s.key);
    }
    return Array.from(keys).sort();
  }, [songs]);

  const filteredAvailableSongs = useMemo(() => {
    const q = addSearchQuery.toLowerCase().trim();
    return songs.filter((s) => {
      if (addKeyFilter !== 'ALL' && s.key !== addKeyFilter) return false;
      if (q) {
        const titleMatch = s.title.toLowerCase().includes(q);
        const artistMatch = s.artist?.toLowerCase().includes(q);
        const keyMatch = s.key?.toLowerCase().includes(q);
        const folderMatch = s.folderName?.toLowerCase().includes(q);
        if (!titleMatch && !artistMatch && !keyMatch && !folderMatch) return false;
      }
      return true;
    });
  }, [songs, addSearchQuery, addKeyFilter]);

  const toggleSelectToAdd = (songId: number) => {
    if (existingSongIds.has(songId)) return;
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      for (const s of filteredAvailableSongs) {
        if (s.id && !existingSongIds.has(s.id)) next.add(s.id);
      }
      return next;
    });
  };

  const handleClearSelectedToAdd = () => {
    setSelectedToAdd(new Set());
  };

  const handleAddSongs = () => {
    if (selectedToAdd.size === 0) return;
    setSetlistSongs((prev) => {
      const already = new Set(prev.map((item) => item.songId));
      const additions = Array.from(selectedToAdd)
        .filter((id) => !already.has(id))
        .map((songId) => ({ songId }));
      return [...prev, ...additions];
    });
    setSelectedToAdd(new Set());
    setAddSearchQuery('');
  };

  const handleRemoveSong = (index: number) => {
    setSetlistSongs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSetlistSongs((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === setlistSongs.length - 1) return;
    setSetlistSongs((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    await onSaveSetlist(
      {
        name,
        description,
        gigDate,
        songs: setlistSongs,
        createdAt: currentSetlist?.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      selectedSetlistId === 'new' ? undefined : selectedSetlistId
    );

    onClose();
  };

  const handleDelete = async () => {
    if (selectedSetlistId !== 'new') {
      if (confirm(`Are you sure you want to delete setlist "${name}"?`)) {
        await onDeleteSetlist(selectedSetlistId);
        if (setlists.length > 1) {
          const remaining = setlists.filter((s) => s.id !== selectedSetlistId);
          handleSelectSetlist(remaining[0].id!);
        } else {
          handleSelectSetlist('new');
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stage-card border border-stage-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-stage-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stage-text">
                Setlist Manager & Gig Repertoire
              </h3>
              <p className="text-xs text-stage-muted">
                Order songs sequentially for live performance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stage-cardHover text-stage-muted hover:text-stage-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stage-border">
          {/* Left Column: Setlists list */}
          <div className="p-3 bg-stage-bg/50 flex flex-col overflow-y-auto max-h-56 md:max-h-none">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-stage-muted uppercase">
                Your Setlists
              </span>
              <button
                onClick={() => handleSelectSetlist('new')}
                className="flex items-center gap-1 text-xs text-stage-accent hover:underline font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-1.5 flex-1">
              {setlists.map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleSelectSetlist(st.id!)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                    selectedSetlistId === st.id
                      ? 'bg-stage-cardHover border-stage-accent text-stage-text shadow-sm'
                      : 'border-transparent text-stage-muted hover:text-stage-text hover:bg-stage-cardHover/60'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">{st.name}</div>
                    <div className="text-[10px] opacity-70 font-mono">
                      {st.songs.length} songs {st.gigDate ? `• ${st.gigDate}` : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Center/Right Columns */}
          <div className="md:col-span-2 p-4 flex flex-col overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-mono font-bold text-stage-muted uppercase block mb-1">
                  Setlist Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Festival 2026"
                  className="w-full h-9 px-3 rounded-lg bg-stage-bg border border-stage-border text-xs font-bold text-stage-text focus:outline-none focus:ring-1 focus:ring-stage-accent"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-stage-muted uppercase block mb-1">
                  Gig Date
                </label>
                <input
                  type="date"
                  value={gigDate}
                  onChange={(e) => setGigDate(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-stage-bg border border-stage-border text-xs text-stage-text focus:outline-none focus:ring-1 focus:ring-stage-accent"
                />
              </div>
            </div>

            {/* Songs in this Setlist */}
            <div className="flex-1 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-stage-muted uppercase">
                  Playing Order ({setlistSongs.length} songs)
                </span>
                <span className="text-[11px] text-stage-muted">
                  Use ▲ ▼ to arrange song sequence
                </span>
              </div>

              <div className="flex-1 max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {setlistSongs.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-stage-border rounded-xl text-stage-muted">
                    <Music className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                    <p className="text-xs font-semibold">No songs in this setlist yet</p>
                    <p className="text-[11px] mt-0.5">
                      Select songs from the library below to add them to this gig.
                    </p>
                  </div>
                ) : (
                  setlistSongs.map((item, idx) => {
                    const songData = songs.find((s) => s.id === item.songId);
                    if (!songData) return null;

                    return (
                      <div
                        key={`st-song-${idx}`}
                        className="p-2 rounded-xl bg-stage-bg border border-stage-border flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-stage-cardHover flex items-center justify-center font-mono font-bold text-[10px] text-stage-accent flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-stage-text truncate mr-1.5">
                              {songData.title}
                            </span>
                            {songData.artist && (
                              <span className="text-[11px] text-stage-muted truncate">
                                ({songData.artist})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {songData.key && (
                            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-stage-cardHover border border-stage-border text-stage-accent">
                              {songData.key}
                            </span>
                          )}

                          <button
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-stage-cardHover text-stage-muted hover:text-stage-text disabled:opacity-20"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === setlistSongs.length - 1}
                            className="p-1 rounded hover:bg-stage-cardHover text-stage-muted hover:text-stage-text disabled:opacity-20"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveSong(idx)}
                            className="p-1 rounded hover:bg-rose-500/20 text-rose-400 hover:text-rose-300"
                            title="Remove from Setlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Add Songs Picker */}
            <div className="pt-2 border-t border-stage-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-stage-muted uppercase">
                  + Add Songs from Library
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSelectAllFiltered}
                    className="text-[11px] text-stage-accent hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-stage-border">|</span>
                  <button
                    onClick={handleClearSelectedToAdd}
                    className="text-[11px] text-stage-muted hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stage-muted" />
                  <input
                    type="text"
                    value={addSearchQuery}
                    onChange={(e) => setAddSearchQuery(e.target.value)}
                    placeholder="Search title, artist, key, folder..."
                    className="w-full h-8 pl-8 pr-7 rounded-lg bg-stage-bg border border-stage-border text-xs text-stage-text placeholder:text-stage-muted focus:outline-none focus:ring-1 focus:ring-stage-accent"
                  />
                  {addSearchQuery && (
                    <button
                      onClick={() => setAddSearchQuery('')}
                      className="absolute right-2 top-2 text-stage-muted hover:text-stage-text"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {availableKeys.length > 0 && (
                  <select
                    value={addKeyFilter}
                    onChange={(e) => setAddKeyFilter(e.target.value)}
                    className="h-8 px-2 rounded-lg bg-stage-bg border border-stage-border text-xs text-stage-muted hover:text-stage-text focus:outline-none cursor-pointer flex-shrink-0"
                  >
                    <option value="ALL">Key: All</option>
                    {availableKeys.map((k) => (
                      <option key={k} value={k}>
                        Key: {k}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {filteredAvailableSongs.length === 0 ? (
                  <div className="p-3 text-center text-[11px] text-stage-muted">
                    No songs match your search.
                  </div>
                ) : (
                  filteredAvailableSongs.map((s) => {
                    const alreadyAdded = existingSongIds.has(s.id!);
                    const isSelected = selectedToAdd.has(s.id!);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleSelectToAdd(s.id!)}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-3 transition ${
                          alreadyAdded
                            ? 'bg-stage-bg/30 border-stage-border/40 text-stage-muted opacity-50 cursor-default'
                            : isSelected
                            ? 'bg-stage-cardHover border-stage-accent/40 text-stage-text cursor-pointer'
                            : 'bg-stage-bg/50 border-stage-border/50 text-stage-muted hover:text-stage-text cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {alreadyAdded ? (
                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : isSelected ? (
                            <CheckSquare className="w-4 h-4 text-stage-accent flex-shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-stage-muted flex-shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="text-xs font-bold truncate">{s.title}</div>
                            <div className="text-[11px] truncate opacity-80">
                              {s.artist || ''} {alreadyAdded ? '• Already in setlist' : ''}
                            </div>
                          </div>
                        </div>

                        {s.key && (
                          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-stage-bg border border-stage-border text-stage-accent flex-shrink-0">
                            {s.key}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={handleAddSongs}
                disabled={selectedToAdd.size === 0}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>
                  Add {selectedToAdd.size} Song{selectedToAdd.size === 1 ? '' : 's'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stage-border bg-stage-bg/40 flex items-center justify-between">
          <div>
            {selectedSetlistId !== 'new' && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Setlist</span>
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
              <span>Save Setlist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
