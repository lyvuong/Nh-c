import React, { useEffect, useRef, useState } from 'react';
import {
  Menu,
  Maximize2,
  Settings,
  Star,
  Cloud,
  FolderOpen,
  ListMusic,
  RefreshCw,
  ChevronDown,
  Check
} from 'lucide-react';
import type { DBSong, DBSetlist } from '../lib/db';
import type { GoogleDriveConfig } from '../lib/googleDrive';

interface HeaderProps {
  currentSong?: DBSong | null;
  activeSetlist?: DBSetlist | null;
  setlists?: DBSetlist[];
  onSelectSetlist?: (setlistId: number | null) => void;
  onOpenSetlistEditor?: () => void;
  songIndex?: number;
  totalSongsInSetlist?: number;
  onToggleSidebarMobile: () => void;
  onEnterStageMode: () => void;
  onOpenSettings: () => void;
  onOpenFolderImport: () => void;
  onOpenGoogleDrive: () => void;
  onToggleFavorite: () => void;
  driveConfig?: GoogleDriveConfig;
  quickSyncStatus?: { state: 'idle' | 'syncing' | 'success' | 'error'; message?: string };
  onQuickDriveSync?: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export const Header: React.FC<HeaderProps> = ({
  currentSong,
  activeSetlist,
  setlists = [],
  onSelectSetlist,
  onOpenSetlistEditor,
  songIndex = 0,
  totalSongsInSetlist = 0,
  onToggleSidebarMobile,
  onEnterStageMode,
  onOpenSettings,
  onOpenFolderImport,
  onOpenGoogleDrive,
  onToggleFavorite,
  driveConfig,
  quickSyncStatus,
  onQuickDriveSync,
}) => {
  const isDriveConfigured = !!driveConfig?.folderId && driveConfig.syncMode !== 'local';
  const isSyncing = quickSyncStatus?.state === 'syncing';
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPickerOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPickerOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isPickerOpen]);

  const pick = (id: number | null) => {
    onSelectSetlist?.(id);
    setIsPickerOpen(false);
  };
  return (
    <header className="relative bg-stage-card border-b border-stage-border px-3 sm:px-4 py-2 flex items-center justify-between gap-2 z-40">
      {/* Left: Mobile Menu & Current Title */}
      <div className="relative flex items-center gap-2.5 min-w-0" ref={pickerRef}>
        <button
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-2 rounded-lg bg-stage-cardHover text-stage-muted hover:text-stage-text active:scale-95 transition"
          title="Open Song Library & Setlists"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-sm sm:text-base text-stage-text truncate">
              {currentSong ? currentSong.title : 'Nhạc'}
            </h2>
            {currentSong && (
              <button
                onClick={onToggleFavorite}
                className="p-1 rounded hover:text-amber-400 text-stage-muted transition flex-shrink-0"
                title={currentSong.isFavorite ? 'Unstar' : 'Star song'}
              >
                <Star
                  className={`w-4 h-4 ${
                    currentSong.isFavorite
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stage-muted'
                  }`}
                />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-stage-muted font-mono min-w-0">
            <button
              onClick={() => setIsPickerOpen((o) => !o)}
              className="flex items-center gap-1 px-1.5 py-0.5 -ml-1.5 rounded-md hover:bg-stage-cardHover text-stage-accent font-semibold transition min-w-0"
              title="Switch setlist"
              aria-haspopup="listbox"
              aria-expanded={isPickerOpen}
            >
              <ListMusic className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{activeSetlist ? activeSetlist.name : 'All Songs'}</span>
              <ChevronDown className={`w-3 h-3 flex-shrink-0 transition ${isPickerOpen ? 'rotate-180' : ''}`} />
            </button>
            {activeSetlist ? (
              <span className="truncate">• Song {songIndex + 1} of {totalSongsInSetlist}</span>
            ) : currentSong?.artist ? (
              <span className="truncate font-sans">• {currentSong.artist}</span>
            ) : null}
          </div>
        </div>

        {isPickerOpen && (
          <div
            role="listbox"
            className="absolute left-0 top-full mt-2 w-64 max-w-[85vw] max-h-72 overflow-y-auto rounded-xl bg-stage-card border border-stage-border shadow-xl shadow-black/40 z-30 py-1"
          >
            <button
              role="option"
              aria-selected={!activeSetlist}
              onClick={() => pick(null)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs text-stage-text hover:bg-stage-cardHover transition"
            >
              <span>All Songs</span>
              {!activeSetlist && <Check className="w-3.5 h-3.5 text-stage-accent" />}
            </button>
            {setlists.map((st) => (
              <button
                key={st.id}
                role="option"
                aria-selected={activeSetlist?.id === st.id}
                onClick={() => pick(st.id!)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs text-stage-text hover:bg-stage-cardHover transition"
              >
                <span className="truncate">{st.name}</span>
                <span className="flex items-center gap-2 flex-shrink-0 text-stage-muted font-mono">
                  {st.songs.length}
                  {activeSetlist?.id === st.id && <Check className="w-3.5 h-3.5 text-stage-accent" />}
                </span>
              </button>
            ))}
            {onOpenSetlistEditor && (
              <button
                onClick={() => {
                  setIsPickerOpen(false);
                  onOpenSetlistEditor();
                }}
                className="w-full px-3 py-2 mt-1 border-t border-stage-border text-left text-xs font-semibold text-stage-accent hover:bg-stage-cardHover transition"
              >
                Manage setlists…
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Open Folder on desktop header */}
        <button
          onClick={onOpenFolderImport}
          className="hidden sm:flex items-center gap-1 h-8 px-2.5 rounded-lg bg-stage-cardHover hover:bg-stage-border text-stage-text text-xs font-semibold border border-stage-border transition"
          title="Import Folder"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Open Folder</span>
        </button>

        {/* Google Drive Quick Sync (only shown once a shared folder is configured) */}
        {isDriveConfigured && (
          <button
            onClick={onQuickDriveSync}
            disabled={isSyncing}
            className="p-2 rounded-lg bg-stage-cardHover text-stage-muted hover:text-stage-text active:scale-95 transition border border-stage-border disabled:opacity-60"
            title={
              quickSyncStatus?.state === 'error'
                ? quickSyncStatus.message
                : quickSyncStatus?.state === 'success'
                ? quickSyncStatus.message
                : `Sync "${driveConfig?.folderName || 'Drive folder'}" now${
                    driveConfig?.lastSyncTime ? ` · last synced ${formatRelativeTime(driveConfig.lastSyncTime)}` : ''
                  }`
            }
          >
            <RefreshCw
              className={`w-4 h-4 ${
                quickSyncStatus?.state === 'error'
                  ? 'text-rose-400'
                  : quickSyncStatus?.state === 'success'
                  ? 'text-emerald-400'
                  : 'text-stage-muted'
              } ${isSyncing ? 'animate-spin' : ''}`}
            />
          </button>
        )}

        {/* Google Drive Cloud Sync / Setup */}
        <button
          onClick={onOpenGoogleDrive}
          className="relative p-2 rounded-lg bg-stage-cardHover text-stage-muted hover:text-stage-text active:scale-95 transition border border-stage-border"
          title={
            isDriveConfigured
              ? `Connected to "${driveConfig?.folderName || 'Drive folder'}" — manage Google Drive sync`
              : 'Connect a Google Drive shared folder'
          }
        >
          <Cloud className="w-4 h-4 text-cyan-400" />
          {isDriveConfigured && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-stage-card" />
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-stage-cardHover text-stage-muted hover:text-stage-text active:scale-95 transition border border-stage-border"
          title="Stage Display & Theme Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Stage Mode Fullscreen button */}
        <button
          onClick={onEnterStageMode}
          disabled={!currentSong}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition"
          title="Enter Stage Performance Mode"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Stage Mode</span>
        </button>
      </div>
    </header>
  );
};
