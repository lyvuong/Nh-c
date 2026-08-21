import React, { useState } from 'react';
import { 
  ListMusic, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  X, 
  Check, 
  Music
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

  // Switch setlist
  const handleSelectSetlist = (id: number | 'new') => {
    setSelectedSetlistId(id);
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

  const handleAddSong = (songId: number) => {
    setSetlistSongs((prev) => [...prev, { songId }]);
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

            {/* Quick Add Dropdown */}
            <div className="pt-2 border-t border-stage-border">
              <label className="text-[11px] font-mono font-bold text-stage-muted uppercase block mb-1">
                + Add Song from Library
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddSong(Number(e.target.value));
                    e.target.value = '';
                  }
                }}
                className="w-full h-8 px-2.5 rounded-lg bg-stage-bg border border-stage-border text-xs text-stage-text focus:outline-none focus:ring-1 focus:ring-stage-accent cursor-pointer"
              >
                <option value="">Choose a song to add...</option>
                {songs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} {s.artist ? `(${s.artist})` : ''} - Key {s.key || 'C'}
                  </option>
                ))}
              </select>
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
