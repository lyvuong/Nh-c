import React from 'react';
import { 
  X, 
  Music, 
  Zap, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  Smartphone, 
  Heart,
  ExternalLink,
  BookOpen,
  Code2,
  CheckCircle2,
  Tag,
  Calendar,
  Server,
  GitBranch,
  Rocket
} from 'lucide-react';
import { APP_VERSION, BUILD_DATE, BUILD_HASH, DISPLAY_VERSION } from '../utils/version';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-stage-card border border-stage-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] transition-colors duration-150 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner Header */}
        <div className="relative h-44 sm:h-52 bg-slate-950 overflow-hidden border-b border-stage-border flex-shrink-0">
          <img 
            src="/banner.jpg" 
            alt="Nhạc Live Stage Banner" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stage-card via-stage-card/40 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-sm border border-white/10 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating Logo & Title */}
          <div className="absolute bottom-3 left-4 sm:left-6 flex items-end gap-3.5">
            <img 
              src="/logo.jpg" 
              alt="Nhạc Logo" 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-xl ring-2 ring-cyan-500/50 object-cover"
            />
            <div className="pb-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Nhạc
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-extrabold">
                  {DISPLAY_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                <em>"Nhạc"</em> means Music in Vietnamese (Âm Nhạc)
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-stage-text">
          
          {/* Mission Statement */}
          <div className="bg-stage-bg/60 rounded-xl p-3.5 border border-stage-border/60">
            <p className="leading-relaxed text-slate-300">
              <strong className="text-cyan-400">Nhạc</strong> is a high-performance, 100% offline Progressive Web App (PWA) engineered specifically for band rehearsals, gigging musicians, acoustic worship, and stage tablets. No internet connection required at venues, no PDF zooming hassles, and zero mid-song page turns.
            </p>
          </div>

          {/* Developer Profile Section (from Statements PWA) */}
          <div className="bg-stage-bg/80 p-4 sm:p-5 rounded-2xl border border-stage-border/80 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
                <Code2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-stage-text">Developer Information</h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/20">
                  <img
                    src="/avatar.png"
                    alt="Ly Vuong"
                    className="w-full h-full rounded-[14px] object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-cyan-500 text-slate-950 rounded-full flex items-center justify-center border-2 border-stage-card" title="Active Developer">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <h4 className="text-sm font-extrabold text-white">Ly Vuong</h4>
                    <p className="text-[11px] text-cyan-400 font-bold">Creator & Lead Engineer</p>
                  </div>

                  <a
                    href="https://github.com/lyvuong/Nh-c"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-stage-cardHover hover:bg-stage-border text-stage-text text-[11px] font-bold px-3 py-1.5 rounded-lg border border-stage-border transition-all self-center sm:self-auto"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                    <span>GitHub Repository</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Engineered with a focus on live performance reliability, 100% offline security, and intuitive musician user experience. Built using state-of-the-art web technologies and Google DeepMind agentic pairing to deliver a native app-like experience across tablet music stands.
                </p>
              </div>
            </div>
          </div>

          {/* Version & Release Specifications */}
          <div className="space-y-2.5">
            <h4 className="font-mono font-bold text-[11px] uppercase tracking-wider text-stage-muted flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" /> Version & Build Specifications
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-stage-bg/60 p-3 rounded-xl border border-stage-border/60 space-y-0.5">
                <span className="text-[10px] text-stage-muted uppercase font-extrabold tracking-wider block">Version</span>
                <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-cyan-400" />
                  v{APP_VERSION}
                </span>
              </div>

              <div className="bg-stage-bg/60 p-3 rounded-xl border border-stage-border/60 space-y-0.5">
                <span className="text-[10px] text-stage-muted uppercase font-extrabold tracking-wider block">Build / Commit</span>
                <span className="text-xs font-mono font-bold text-stage-text flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {BUILD_HASH ? `#${BUILD_HASH}` : 'main'}
                </span>
              </div>

              <div className="bg-stage-bg/60 p-3 rounded-xl border border-stage-border/60 space-y-0.5">
                <span className="text-[10px] text-stage-muted uppercase font-extrabold tracking-wider block">Build Date</span>
                <span className="text-xs font-mono font-bold text-stage-text flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  {BUILD_DATE}
                </span>
              </div>

              <div className="bg-stage-bg/60 p-3 rounded-xl border border-stage-border/60 space-y-0.5">
                <span className="text-[10px] text-stage-muted uppercase font-extrabold tracking-wider block">Storage</span>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Server className="w-3 h-3 text-emerald-400" />
                  IndexedDB
                </span>
              </div>
            </div>

            {/* Version Auto-Bump Notice */}
            <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center gap-2 text-[11px] text-cyan-300">
              <Rocket className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Auto-Versioning:</strong> Minor version automatically increments on every git push / release cycle via automated build hooks.
              </span>
            </div>
          </div>

          {/* Key Highlights Grid */}
          <div>
            <h4 className="font-mono font-bold text-[11px] uppercase tracking-wider text-stage-muted mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Core Features
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <div className="p-3 rounded-xl bg-stage-bg border border-stage-border/70 flex gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 flex-shrink-0 h-fit">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-stage-text">1-Screen Auto-Fit Engine</h5>
                  <p className="text-[11px] text-stage-muted mt-0.5 leading-normal">
                    Smart multi-column layout (1, 2, or 3 columns) dynamically scales font size so the complete song fits on one screen without scrolling.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stage-bg border border-stage-border/70 flex gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0 h-fit">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-stage-text">Real-Time Transposition</h5>
                  <p className="text-[11px] text-stage-muted mt-0.5 leading-normal">
                    Transpose semitones instantly with intelligent flat (♭) vs sharp (#) enharmonics, Capo calculation, and slash chord support.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stage-bg border border-stage-border/70 flex gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0 h-fit">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-stage-text">100% Offline & Private</h5>
                  <p className="text-[11px] text-stage-muted mt-0.5 leading-normal">
                    All songs and setlists are saved locally in your browser’s IndexedDB. Works on airplanes, basements, and remote gigs with zero Wi-Fi.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stage-bg border border-stage-border/70 flex gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 flex-shrink-0 h-fit">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-stage-text">Stage Mode & Foot Pedals</h5>
                  <p className="text-[11px] text-stage-muted mt-0.5 leading-normal">
                    Fullscreen distraction-free view with Screen Wake Lock API and Bluetooth page-turner pedal support (AirTurn, PageFlip, Donner, Coda).
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Bluetooth Pedal & Keyboard Navigation Guide */}
          <div>
            <h4 className="font-mono font-bold text-[11px] uppercase tracking-wider text-stage-muted mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Hotkeys & Foot Pedal Guide
            </h4>
            <div className="overflow-x-auto rounded-xl border border-stage-border">
              <table className="w-full text-left text-[11px] divide-y divide-stage-border">
                <thead className="bg-stage-bg/80 text-stage-muted font-mono font-bold">
                  <tr>
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Keyboard Shortcut</th>
                    <th className="py-2 px-3">Bluetooth Pedal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stage-border/40 font-mono text-slate-300">
                  <tr className="hover:bg-stage-cardHover/50">
                    <td className="py-1.5 px-3 font-sans font-medium text-stage-text">Next Song / Page</td>
                    <td className="py-1.5 px-3 text-cyan-300">ArrowRight, PageDown, Space, Enter</td>
                    <td className="py-1.5 px-3 text-emerald-400">Right / Down Pedal</td>
                  </tr>
                  <tr className="hover:bg-stage-cardHover/50">
                    <td className="py-1.5 px-3 font-sans font-medium text-stage-text">Previous Song / Page</td>
                    <td className="py-1.5 px-3 text-cyan-300">ArrowLeft, PageUp, Backspace</td>
                    <td className="py-1.5 px-3 text-emerald-400">Left / Up Pedal</td>
                  </tr>
                  <tr className="hover:bg-stage-cardHover/50">
                    <td className="py-1.5 px-3 font-sans font-medium text-stage-text">Transpose Up / Down</td>
                    <td className="py-1.5 px-3 text-amber-300">+ / - (or = / _)</td>
                    <td className="py-1.5 px-3 text-slate-500">—</td>
                  </tr>
                  <tr className="hover:bg-stage-cardHover/50">
                    <td className="py-1.5 px-3 font-sans font-medium text-stage-text">Reset Transpose</td>
                    <td className="py-1.5 px-3 text-amber-300">0 or R</td>
                    <td className="py-1.5 px-3 text-slate-500">—</td>
                  </tr>
                  <tr className="hover:bg-stage-cardHover/50">
                    <td className="py-1.5 px-3 font-sans font-medium text-stage-text">Toggle Stage Mode</td>
                    <td className="py-1.5 px-3 text-purple-300">F or F11</td>
                    <td className="py-1.5 px-3 text-slate-500">—</td>
                  </tr>
                  <tr className="hover:bg-stage-cardHover/50">
                    <td className="py-1.5 px-3 font-sans font-medium text-stage-text">Exit Stage Mode / Close</td>
                    <td className="py-1.5 px-3 text-rose-300">Escape</td>
                    <td className="py-1.5 px-3 text-slate-500">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ChordPro Syntax Directives Quick Reference */}
          <div>
            <h4 className="font-mono font-bold text-[11px] uppercase tracking-wider text-stage-muted mb-2 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-purple-400" /> ChordPro Syntax Directives
            </h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-stage-border font-mono text-[11px] space-y-1 text-slate-300 overflow-x-auto">
              <p><span className="text-cyan-400">{'{title: Song Title}'}</span> — Song name</p>
              <p><span className="text-cyan-400">{'{artist: Artist Name}'}</span> — Artist/Composer</p>
              <p><span className="text-cyan-400">{'{key: G}'}</span>, <span className="text-cyan-400">{'{capo: 2}'}</span>, <span className="text-cyan-400">{'{tempo: 120}'}</span> — Song metadata</p>
              <p><span className="text-cyan-400">{'{comment: Intro / Solo}'}</span> — Section annotation banners</p>
              <p><span className="text-amber-400">[G]</span> <span className="text-slate-400">Amazing</span> <span className="text-amber-400">[C]</span><span className="text-slate-400">Grace how</span> <span className="text-amber-400">[G]</span><span className="text-slate-400">sweet the sound</span> — Inline chords</p>
            </div>
          </div>

          {/* App Info & Version */}
          <div className="pt-3 border-t border-stage-border/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stage-muted">
            <div className="flex items-center gap-1.5">
              <span>{DISPLAY_VERSION}</span>
              <span>•</span>
              <span>PWA Ready</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">100% Offline IndexedDB</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>for live musicians everywhere</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-stage-border bg-stage-bg/40 flex items-center justify-between">
          <a
            href="https://github.com/lyvuong/Nh-c"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-stage-muted hover:text-stage-text font-medium transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>GitHub Repository</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
