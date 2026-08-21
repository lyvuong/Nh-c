import React from 'react';
import { 
  Settings as SettingsIcon, 
  X, 
  Download, 
  Upload, 
  RotateCcw
} from 'lucide-react';

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
      <div className="bg-stage-card border border-stage-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
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
          {/* Stage Theme */}
          <div>
            <label className="font-mono font-bold text-stage-muted uppercase block mb-2">
              Stage Display Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSelectTheme('stage-dark')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2 ${
                  stageTheme === 'stage-dark'
                    ? 'bg-stage-cardHover border-stage-accent text-stage-text ring-1 ring-stage-accent'
                    : 'bg-stage-bg border-stage-border text-stage-muted'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-[#0a0d14] border border-cyan-400" />
                <div>
                  <div className="font-bold text-xs">Stage Dark</div>
                  <div className="text-[10px] opacity-70">Deep Navy / Cyan</div>
                </div>
              </button>

              <button
                onClick={() => onSelectTheme('oled-black')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2 ${
                  stageTheme === 'oled-black'
                    ? 'bg-stage-cardHover border-stage-accent text-stage-text ring-1 ring-stage-accent'
                    : 'bg-stage-bg border-stage-border text-stage-muted'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-black border border-white" />
                <div>
                  <div className="font-bold text-xs">OLED Pitch Black</div>
                  <div className="text-[10px] opacity-70">Pure Black / Contrast</div>
                </div>
              </button>

              <button
                onClick={() => onSelectTheme('amber-warm')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2 ${
                  stageTheme === 'amber-warm'
                    ? 'bg-stage-cardHover border-stage-accent text-stage-text ring-1 ring-stage-accent'
                    : 'bg-stage-bg border-stage-border text-stage-muted'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-[#17120a] border border-amber-400" />
                <div>
                  <div className="font-bold text-xs">Stage Amber</div>
                  <div className="text-[10px] opacity-70">Warm Vintage Look</div>
                </div>
              </button>

              <button
                onClick={() => onSelectTheme('light-contrast')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2 ${
                  stageTheme === 'light-contrast'
                    ? 'bg-stage-cardHover border-stage-accent text-stage-text ring-1 ring-stage-accent'
                    : 'bg-stage-bg border-stage-border text-stage-muted'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-900" />
                <div>
                  <div className="font-bold text-xs">High Contrast Light</div>
                  <div className="text-[10px] opacity-70">Daytime / Rehearsal</div>
                </div>
              </button>
            </div>
          </div>

          {/* Chord Highlight Color */}
          <div>
            <label className="font-mono font-bold text-stage-muted uppercase block mb-2">
              Chord Highlight Color
            </label>
            <div className="flex items-center gap-2">
              {[
                { id: '#38bdf8', name: 'Electric Cyan' },
                { id: '#fbbf24', name: 'Stage Amber' },
                { id: '#34d399', name: 'Vibrant Emerald' },
                { id: '#f43f5e', name: 'Neon Rose' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectChordColor(c.id)}
                  className={`flex-1 p-2 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                    chordColor === c.id
                      ? 'border-stage-accent bg-stage-cardHover font-bold text-stage-text'
                      : 'border-stage-border bg-stage-bg text-stage-muted'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: c.id }}
                  />
                  <span className="text-[11px] truncate">{c.name}</span>
                </button>
              ))}
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
                onClick={onTogglePreferFlats}
                className="px-3 py-1.5 rounded-lg bg-stage-cardHover border border-stage-border text-xs font-mono font-bold text-stage-accent"
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
                onClick={onExportBackup}
                className="p-2.5 rounded-xl bg-stage-bg hover:bg-stage-cardHover border border-stage-border text-stage-text flex items-center justify-center gap-1.5 font-semibold transition"
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
              onClick={() => {
                if (confirm('Restore default classic ChordPro sample songs?')) {
                  onResetSampleLibrary();
                }
              }}
              className="w-full p-2 text-center text-stage-muted hover:text-amber-300 text-xs flex items-center justify-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Pre-loaded Sample Songs</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stage-border bg-stage-bg/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stage-cardHover hover:bg-stage-border text-stage-text font-bold text-xs border border-stage-border transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
