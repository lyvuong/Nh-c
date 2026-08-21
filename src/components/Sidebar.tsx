import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  FolderOpen, 
  ListMusic, 
  Star, 
  Music, 
  X,
  Edit3
} from 'lucide-react';
import type { DBSong, DBSetlist } from '../lib/db';

interface SidebarProps {
  songs: DBSong[];
  setlists: DBSetlist[];
  activeSongId?: number;
  activeSetlistId?: number | null;
  onSelectSong: (songId: number) => void;
  onSelectSetlist: (setlistId: number | null) => void;
  onCreateSong: () => void;
  onEditSong: (song: DBSong) => void;
  onOpenFolderImport: () => void;
  onOpenSetlistEditor: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onToggleFavorite: (songId: number, e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  songs,
  setlists,
  activeSongId,
  activeSetlistId,
  onSelectSong,
  onSelectSetlist,
  onCreateSong,
  onEditSong,
  onOpenFolderImport,
  onOpenSetlistEditor,
  isOpenMobile,
  onCloseMobile,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeyFilter, setSelectedKeyFilter] = useState<string>('ALL');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');

  // Unique folders in the library
  const availableFolders = useMemo(() => {
    const folders = new Set<string>();
    for (const song of songs) {
      if (song.folderName) folders.add(song.folderName);
    }
    return Array.from(folders);
  }, [songs]);

  // Unique keys for filter
  const availableKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const song of songs) {
      if (song.key) keys.add(song.key);
    }
    return Array.from(keys);
  }, [songs]);

  // Active Setlist Song IDs if a setlist is selected
  const activeSetlistSongIds = useMemo(() => {
    if (!activeSetlistId) return null;
    const current = setlists.find((s) => s.id === activeSetlistId);
    if (!current) return null;
    return new Set(current.songs.map((item) => item.songId));
  }, [activeSetlistId, setlists]);

  // Filtered Songs
  const filteredSongs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return songs.filter((song) => {
      if (activeSetlistSongIds && !activeSetlistSongIds.has(song.id!)) {
        return false;
      }

      if (showOnlyFavorites && !song.isFavorite) {
        return false;
      }

      if (selectedFolder !== 'ALL' && song.folderName !== selectedFolder) {
        return false;
      }

      if (selectedKeyFilter !== 'ALL' && song.key !== selectedKeyFilter) {
        return false;
      }

      if (q) {
        const titleMatch = song.title.toLowerCase().includes(q);
        const artistMatch = song.artist?.toLowerCase().includes(q);
        const keyMatch = song.key?.toLowerCase().includes(q);
        const lyricsMatch = song.content?.toLowerCase().includes(q);
        const folderMatch = song.folderName?.toLowerCase().includes(q);
        if (!titleMatch && !artistMatch && !keyMatch && !lyricsMatch && !folderMatch) {
          return false;
        }
      }

      return true;
    });
  }, [songs, activeSetlistSongIds, showOnlyFavorites, selectedFolder, selectedKeyFilter, searchQuery]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-40 w-80 max-w-[85vw] bg-stage-card border-r border-stage-border flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-stage-border/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-cyan-500/20">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-stage-text tracking-tight flex items-center gap-1.5">
                StageChord <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">PWA</span>
              </h2>
              <p className="text-[11px] text-stage-muted">Offline Band ChordPro</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg hover:bg-stage-cardHover text-stage-muted hover:text-stage-text"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Setlist Selector Bar */}
        <div className="p-2.5 bg-stage-bg/60 border-b border-stage-border/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono font-bold text-stage-muted uppercase flex items-center gap-1">
              <ListMusic className="w-3.5 h-3.5 text-stage-accent" /> Setlist
            </span>
            <button
              onClick={onOpenSetlistEditor}
              className="text-[11px] text-stage-accent hover:underline font-semibold"
            >
              Manage ({setlists.length})
            </button>
          </div>
          <select
            value={activeSetlistId === null ? 'ALL' : activeSetlistId}
            onChange={(e) => {
              const val = e.target.value;
              onSelectSetlist(val === 'ALL' ? null : Number(val));
            }}
            className="w-full h-8 px-2.5 rounded-lg bg-stage-cardHover border border-stage-border text-xs font-semibold text-stage-text focus:outline-none focus:ring-1 focus:ring-stage-accent cursor-pointer"
          >
            <option value="ALL">🎵 All Songs ({songs.length})</option>
            {setlists.map((st) => (
              <option key={st.id} value={st.id}>
                📋 {st.name} ({st.songs.length})
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons: Import Folder & New Song */}
        <div className="p-2.5 border-b border-stage-border/60 grid grid-cols-2 gap-2">
          <button
            onClick={onOpenFolderImport}
            className="flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg bg-stage-cardHover hover:bg-stage-border text-stage-text text-xs font-semibold border border-stage-border active:scale-95 transition"
            title="Import folder of ChordPro files from tablet or computer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Open Folder</span>
          </button>
          <button
            onClick={onCreateSong}
            className="flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 active:scale-95 transition"
            title="Create new ChordPro song"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Song</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-2.5 border-b border-stage-border/60 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-stage-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs, artist, key, lyrics..."
              className="w-full h-9 pl-8 pr-7 rounded-lg bg-stage-bg border border-stage-border text-xs text-stage-text placeholder:text-stage-muted focus:outline-none focus:ring-1 focus:ring-stage-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2.5 text-stage-muted hover:text-stage-text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`flex items-center gap-1 h-6 px-2 rounded text-[11px] font-medium border transition ${
                showOnlyFavorites
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-stage-bg text-stage-muted border-stage-border hover:text-stage-text'
              }`}
            >
              <Star className={`w-3 h-3 ${showOnlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Starred</span>
            </button>

            {availableFolders.length > 0 && (
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="h-6 px-1.5 rounded bg-stage-bg border border-stage-border text-[11px] text-stage-muted hover:text-stage-text focus:outline-none cursor-pointer max-w-[120px] truncate"
              >
                <option value="ALL">📁 All Folders</option>
                {availableFolders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            )}

            {availableKeys.length > 0 && (
              <select
                value={selectedKeyFilter}
                onChange={(e) => setSelectedKeyFilter(e.target.value)}
                className="h-6 px-1.5 rounded bg-stage-bg border border-stage-border text-[11px] text-stage-muted hover:text-stage-text focus:outline-none cursor-pointer"
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
        </div>

        {/* Song List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-stage-border/30">
          {filteredSongs.length === 0 ? (
            <div className="text-center py-10 px-4 text-stage-muted">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold">No songs found</p>
              <p className="text-[11px] mt-1 opacity-70">
                Try clearing search filters or import a folder of ChordPro files.
              </p>
            </div>
          ) : (
            filteredSongs.map((song) => {
              const isActive = song.id === activeSongId;
              return (
                <div
                  key={song.id}
                  onClick={() => onSelectSong(song.id!)}
                  className={`group p-2 rounded-xl cursor-pointer transition flex items-center justify-between gap-2 border ${
                    isActive
                      ? 'bg-stage-accent/15 border-stage-accent/50 text-stage-text shadow-sm'
                      : 'hover:bg-stage-cardHover border-transparent text-stage-text'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs truncate">
                        {song.title}
                      </span>
                      {song.isFavorite && (
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stage-muted">
                      {song.artist && <span className="truncate">{song.artist}</span>}
                      {song.folderName && (
                        <span className="text-[10px] font-mono px-1 rounded bg-stage-bg/80 border border-stage-border/50 truncate max-w-[80px]">
                          {song.folderName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {song.key && (
                      <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-stage-cardHover border border-stage-border text-stage-accent">
                        {song.key}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSong(song);
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-cyan-300 transition"
                      title="Edit song source"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-stage-muted hover:text-cyan-300" />
                    </button>
                    <button
                      onClick={(e) => onToggleFavorite(song.id!, e)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-amber-400 transition"
                      title={song.isFavorite ? 'Unstar' : 'Star'}
                    >
                      <Star className={`w-3.5 h-3.5 ${song.isFavorite ? 'opacity-100 fill-amber-400 text-amber-400' : 'text-stage-muted'}`} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 border-t border-stage-border/60 bg-stage-bg/40 flex items-center justify-between text-[11px] text-stage-muted font-mono">
          <span>{filteredSongs.length} / {songs.length} Songs</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            100% Offline
          </span>
        </div>
      </aside>
    </>
  );
};
