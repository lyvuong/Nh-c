import React from 'react';
import { 
  Square, 
  Minus, 
  Plus, 
  RotateCcw, 
  Gauge
} from 'lucide-react';

interface AutoScrollControllerProps {
  isAutoScrolling: boolean;
  onToggleAutoScroll: () => void;
  scrollSpeedBpm: number;
  onScrollSpeedChange: (speed: number) => void;
  onRewindToTop: () => void;
}

export const AutoScrollController: React.FC<AutoScrollControllerProps> = ({
  isAutoScrolling,
  onToggleAutoScroll,
  scrollSpeedBpm,
  onScrollSpeedChange,
  onRewindToTop,
}) => {
  if (!isAutoScrolling) return null;

  const handleDecrease = () => {
    onScrollSpeedChange(Math.max(10, scrollSpeedBpm - 5));
  };

  const handleIncrease = () => {
    onScrollSpeedChange(Math.min(240, scrollSpeedBpm + 5));
  };

  return (
    <div className="fixed bottom-12 sm:bottom-14 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-1.5 p-1.5 sm:p-2 rounded-2xl bg-stage-card/95 backdrop-blur-md border border-stage-border shadow-2xl ring-1 ring-cyan-500/20 text-stage-text">
        
        {/* Rewind to Top */}
        <button
          onClick={onRewindToTop}
          className="p-2 rounded-xl bg-stage-cardHover hover:bg-stage-border text-stage-muted hover:text-stage-text transition active:scale-95 cursor-pointer"
          title="Rewind to Top"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-stage-border/70 mx-0.5" />

        {/* Speed Slower Button */}
        <button
          onClick={handleDecrease}
          className="p-2 rounded-xl bg-stage-cardHover hover:bg-stage-border text-stage-muted hover:text-stage-text transition active:scale-95 cursor-pointer"
          title="Slow Down (-5 BPM)"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Speed Indicator & Direct Input */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-stage-bg border border-stage-border font-mono">
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          <input
            type="number"
            min={10}
            max={240}
            value={scrollSpeedBpm}
            onChange={(e) => onScrollSpeedChange(Math.max(10, Math.min(240, Number(e.target.value) || 60)))}
            className="w-10 bg-transparent text-center text-xs font-black text-stage-text focus:outline-none"
            title="Scroll Speed (BPM)"
          />
          <span className="text-[10px] text-stage-muted font-sans font-bold">BPM</span>
        </div>

        {/* Speed Faster Button */}
        <button
          onClick={handleIncrease}
          className="p-2 rounded-xl bg-stage-cardHover hover:bg-stage-border text-stage-muted hover:text-stage-text transition active:scale-95 cursor-pointer"
          title="Speed Up (+5 BPM)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-stage-border/70 mx-0.5" />

        {/* Stop Button */}
        <button
          onClick={onToggleAutoScroll}
          className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs shadow-md shadow-rose-500/20 active:scale-95 transition flex items-center gap-1 cursor-pointer"
          title="Stop Auto-Scroll"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Stop</span>
        </button>

      </div>
    </div>
  );
};
