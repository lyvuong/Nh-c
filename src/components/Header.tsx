import React from 'react';
import { 
  Menu, 
  Maximize2, 
  Settings, 
  Star, 
  FolderOpen, 
  ListMusic,
  Info
} from 'lucide-react';
import type { DBSong, DBSetlist } from '../lib/db';

interface HeaderProps {
  currentSong?: DBSong | null;
  activeSetlist?: DBSetlist | null;
  songIndex?: number;
  totalSongsInSetlist?: number;
  onToggleSidebarMobile: () => void;
  onEnterStageMode: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenFolderImport: () => void;
  onToggleFavorite: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSong,
  activeSetlist,
  songIndex = 0,
  totalSongsInSetlist = 0,
  onToggleSidebarMobile,
  onEnterStageMode,
  onOpenSettings,
  onOpenAbout,
  onOpenFolderImport,
  onToggleFavorite,
}) => {
  return (
    <header className="bg-stage-card border-b border-stage-border px-3 sm:px-4 py-2 flex items-center justify-between gap-2 z-20">
      {/* Left: Mobile Menu & Current Title */}
      <div className="flex items-center gap-2.5 min-w-0">
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

          {activeSetlist ? (
            <div className="flex items-center gap-1.5 text-[11px] text-stage-muted font-mono truncate">
              <span className="text-stage-accent font-semibold flex items-center gap-1">
                <ListMusic className="w-3 h-3" /> {activeSetlist.name}
              </span>
              <span>• Song {songIndex + 1} of {totalSongsInSetlist}</span>
            </div>
          ) : currentSong?.artist ? (
            <p className="text-[11px] text-stage-muted truncate">
              {currentSong.artist}
            </p>
          ) : (
            <p className="text-[11px] text-stage-muted">
              Select or import a song to begin
            </p>
          )}
        </div>
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

        {/* About / Info button */}
        <button
          onClick={onOpenAbout}
          className="p-2 rounded-lg bg-stage-cardHover text-stage-muted hover:text-stage-text active:scale-95 transition border border-stage-border"
          title="About Nhạc, Guide & Shortcuts"
        >
          <Info className="w-4 h-4 text-cyan-400" />
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
