import React from 'react';
import { Target } from 'lucide-react';
import { Button } from '../ui/button';

interface TimelineSliderProps {
  scrollRatio: number;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScrollToNow: () => void;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = React.memo(({
  scrollRatio,
  onSliderChange,
  onScrollToNow
}) => {
  return (
    <div className="timeline-slider-bar flex items-center gap-3 bg-slate-950/90 backdrop-blur-xl border border-sky-400/20 rounded-2xl px-4 sm:px-5 py-3 mt-4 md:mt-5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5),0_8px_24px_-6px_rgba(0,0,0,0.7)] min-h-[58px]">
      <span className="font-mono text-xs font-bold text-slate-400 tabular-nums select-none">00:00</span>
      <div className="flex-1 flex items-center relative min-h-[44px]">
        <input
          type="range"
          min="0"
          max="1"
          step="0.002"
          value={scrollRatio}
          onChange={onSliderChange}
          className="timeline-range-slider"
          aria-label="Deslizar horizontalmente por las 24 horas"
        />
      </div>
      <span className="font-mono text-xs font-bold text-slate-400 tabular-nums select-none">24:00</span>

      <Button
        type="button"
        variant="now"
        onClick={onScrollToNow}
        className="gap-2 px-4 py-2 min-h-[42px] min-w-[42px] cursor-pointer text-xs font-semibold"
        title="Centrar vista en la hora actual"
        aria-label="Centrar en hora actual"
      >
        <Target size={16} />
        <span>Ahora</span>
      </Button>
    </div>
  );
});

TimelineSlider.displayName = 'TimelineSlider';
