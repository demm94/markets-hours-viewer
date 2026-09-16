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
    <div className="timeline-slider-bar flex items-center gap-2 sm:gap-3 bg-muted backdrop-blur-xl border border-sky-400/20 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-1.5 sm:py-2.5 mt-2 sm:mt-3 md:mt-4 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5),0_8px_24px_-6px_rgba(0,0,0,0.7)] min-h-[40px] sm:min-h-[52px]">
      <span className="font-mono text-[10px] sm:text-xs font-bold text-muted-foreground tabular-nums select-none">00:00</span>
      <div className="flex-1 flex items-center relative min-h-[32px] sm:min-h-[44px]">
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
      <span className="font-mono text-[10px] sm:text-xs font-bold text-muted-foreground tabular-nums select-none">24:00</span>

      <Button
        type="button"
        variant="now"
        onClick={onScrollToNow}
        className="gap-1.5 px-2.5 sm:px-4 py-1 sm:py-2 min-h-[32px] sm:min-h-[40px] min-w-[32px] sm:min-w-[40px] cursor-pointer text-[11px] sm:text-xs font-semibold"
        title="Centrar vista en la hora actual"
        aria-label="Centrar en hora actual"
      >
        <Target size={14} className="sm:w-4 sm:h-4" />
        <span>Ahora</span>
      </Button>
    </div>
  );
});

TimelineSlider.displayName = 'TimelineSlider';
