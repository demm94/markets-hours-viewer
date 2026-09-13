import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { CHILE_TZ } from '../core/timezone';

export interface CurrentTimeState {
  now: DateTime;
  currentMinutes: number; // 0-1440
  timeFormatted: string;
  dateFormatted: string;
}

export function useCurrentTime(): CurrentTimeState {
  const [now, setNow] = useState<DateTime>(() => DateTime.now().setZone(CHILE_TZ));

  useEffect(() => {
    // Update every second for live second ticker
    const interval = setInterval(() => {
      setNow(DateTime.now().setZone(CHILE_TZ));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const currentMinutes = now.hour * 60 + now.minute + now.second / 60;

  return {
    now,
    currentMinutes,
    timeFormatted: now.toFormat('HH:mm:ss'),
    dateFormatted: now.toFormat("EEEE, d 'de' MMMM", { locale: 'es' })
  };
}
