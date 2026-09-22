import React from 'react';
import { Target, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';

export interface TimelineSliderProps {
  scrollRatio?: number;
  onSliderChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScrollToNow?: () => void;
  scrubberMinutes?: number;
  currentMinutes?: number;
  isScrubbing?: boolean;
  onScrubMinutesChange?: (minutes: number) => void;
  onResetToNow?: () => void;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = React.memo(({
  scrollRatio = 0,
  onSliderChange,
  onScrollToNow,
  scrubberMinutes,
  currentMinutes,
  isScrubbing = false,
  onScrubMinutesChange,
  onResetToNow
}) => {
  const activeMinutes = scrubberMinutes ?? (currentMinutes ?? Math.round(scrollRatio * 1440));

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (onScrubMinutesChange) {
      onScrubMinutesChange(val);
    }
    if (onSliderChange) {
      onSliderChange(e);
    }
  };

  const handleReset = () => {
    if (onResetToNow) {
      onResetToNow();
    }
    if (onScrollToNow) {
      onScrollToNow();
    }
  };

  return (
    <div className="timeline-slider-bar flex items-center gap-2 sm:gap-3 bg-muted backdrop-blur-xl border border-sky-400/20 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-1.5 sm:py-2.5 mt-1 sm:mt-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5),0_8px_24px_-6px_rgba(0,0,0,0.7)] min-h-[38px] sm:min-h-[48px]">
      <span className="font-mono text-[10px] sm:text-xs font-bold text-muted-foreground tabular-nums select-none">
        00:00
      </span>

      <div className="flex-1 flex items-center relative min-h-[30px] sm:min-h-[38px]">
        <input
          type="range"
          min="0"
          max="1440"
          step="5"
          value={activeMinutes}
          onChange={handleRangeChange}
          className="timeline-range-slider"
          aria-label="Explorar horas del día de 00:00 a 24:00"
        />
      </div>

      <span className="font-mono text-[10px] sm:text-xs font-bold text-muted-foreground tabular-nums select-none">
        24:00
      </span>

      {isScrubbing ? (
        <Button
          type="button"
          variant="default"
          onClick={handleReset}
          className="gap-1.5 px-2.5 sm:px-4 py-1 sm:py-2 min-h-[30px] sm:min-h-[36px] cursor-pointer text-[11px] sm:text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-[0_0_12px_rgba(56,189,248,0.4)] animate-in fade-in"
          title="Restablecer a la hora actual"
          aria-label="Restablecer a hora actual"
        >
          <RotateCcw size={13} className="sm:w-3.5 sm:h-3.5" />
          <span className="hidden xs:inline sm:inline">Volver a </span>
          <span>Ahora</span>
        </Button>
      ) : (
        <Button
          type="button"
          variant="now"
          onClick={handleReset}
          className="gap-1.5 px-2.5 sm:px-4 py-1 sm:py-2 min-h-[30px] sm:min-h-[36px] min-w-[32px] sm:min-w-[40px] cursor-pointer text-[11px] sm:text-xs font-semibold"
          title="Centrar vista en la hora actual"
          aria-label="Centrar en hora actual"
        >
          <Target size={14} className="sm:w-4 sm:h-4" />
          <span>Ahora</span>
        </Button>
      )}
    </div>
  );
});

TimelineSlider.displayName = 'TimelineSlider';
