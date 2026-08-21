import React from 'react';
import { 
  Settings as SettingsIcon, 
  X, 
  Download, 
  Upload, 
  RotateCcw,
  Check
} from 'lucide-react';
import { STAGE_THEMES, CHORD_COLORS } from '../lib/themeManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageTheme: string;
  onSelectTheme: (theme: string) => void;
  preferFlats: boolean;
  onTogglePreferFlats: () => void;
  chordColor: string;
  onSelectChordColor: (color: string) => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetSampleLibrary: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  stageTheme,
  onSelectTheme,
  preferFlats,
  onTogglePreferFlats,
  chordColor,
  onSelectChordColor,
  onExportBackup,
  onImportBackup,
  onResetSampleLibrary,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stage-card border border-stage-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col transition-colors duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-stage-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-stage-cardHover text-stage-accent">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stage-text">
                App & Stage Settings
              </h3>
              <p className="text-xs text-stage-muted">
                Configure stage visuals, transposing preferences, and library backups
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
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Stage Theme Selection */}
          <div>
            <label className="font-mono font-bold text-stage-muted uppercase block mb-2">
              Stage Display Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(STAGE_THEMES).map((theme) => {
                const isSelected = stageTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onSelectTheme(theme.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-stage-cardHover border-stage-accent text-stage-text ring-2 ring-stage-accent shadow-md'
                        : 'bg-stage-bg border-stage-border text-stage-muted hover:border-stage-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-xs border"
                        style={{
                          backgroundColor: theme.previewBg,
                          borderColor: theme.previewBorder,
                        }}
                      />
                      <div className="truncate">
                        <div className="font-bold text-xs truncate text-stage-text">{theme.name}</div>
                        <div className="text-[10px] text-stage-muted truncate">{theme.description}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-stage-accent flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chord Highlight Color Selection */}
          <div>
            <label className="font-mono font-bold text-stage-muted uppercase block mb-2">
              Chord Highlight Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CHORD_COLORS.map((c) => {
                const isSelected = chordColor.toLowerCase() === c.id.toLowerCase();
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectChordColor(c.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stage-accent bg-stage-cardHover font-bold text-stage-text ring-2 ring-stage-accent shadow-md'
                        : 'border-stage-border bg-stage-bg text-stage-muted hover:border-stage-accent/50'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-black/30 shadow-xs"
                      style={{ backgroundColor: c.id }}
                    />
                    <span className="text-[11px] font-semibold truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accidental Preference */}
          <div>
            <label className="font-mono font-bold text-stage-muted uppercase block mb-1">
              Accidental Preference
            </label>
            <div className="flex items-center justify-between p-3 rounded-xl bg-stage-bg border border-stage-border">
              <div>
                <div className="font-bold text-stage-text">
                  Enharmonic Spelling: {preferFlats ? 'Flats (♭)' : 'Sharps (#)'}
                </div>
                <div className="text-[11px] text-stage-muted mt-0.5">
                  Display transposed notes as Bb vs A#
                </div>
              </div>
              <button
                type="button"
                onClick={onTogglePreferFlats}
                className="px-3 py-1.5 rounded-lg bg-stage-cardHover border border-stage-border text-xs font-mono font-bold text-stage-accent hover:bg-stage-card transition cursor-pointer"
              >
                Switch to {preferFlats ? '# Sharps' : '♭ Flats'}
              </button>
            </div>
          </div>

          {/* Offline Data & Library Management */}
          <div className="pt-2 border-t border-stage-border space-y-2">
            <label className="font-mono font-bold text-stage-muted uppercase block">
              Library Backup & Offline Data
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportBackup}
                className="p-2.5 rounded-xl bg-stage-bg hover:bg-stage-cardHover border border-stage-border text-stage-text flex items-center justify-center gap-1.5 font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-stage-accent" />
                <span>Export Library JSON</span>
              </button>

              <label className="p-2.5 rounded-xl bg-stage-bg hover:bg-stage-cardHover border border-stage-border text-stage-text flex items-center justify-center gap-1.5 font-semibold transition cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm('Restore default classic ChordPro sample songs?')) {
                  onResetSampleLibrary();
                }
              }}
              className="w-full p-2 text-center text-stage-muted hover:text-amber-300 text-xs flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Pre-loaded Sample Songs</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stage-border bg-stage-bg/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stage-cardHover hover:bg-stage-border text-stage-text font-bold text-xs border border-stage-border transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
