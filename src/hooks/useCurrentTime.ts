import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { CHILE_TZ } from '../core/timezone';

export interface CurrentTimeState {
  now: DateTime;
  currentMinutes: number; // 0-1440 (minute resolution)
  currentSeconds: number; // 0-59
  timeFormatted: string;
  dateFormatted: string;
  minuteKey: string;
}

export function useCurrentTime(): CurrentTimeState {
  const [now, setNow] = useState<DateTime>(() => DateTime.now().setZone(CHILE_TZ));

  useEffect(() => {
    // Update every second for live second ticker in header
    const interval = setInterval(() => {
      setNow(DateTime.now().setZone(CHILE_TZ));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const currentMinutes = now.hour * 60 + now.minute;
  const minuteKey = `${now.year}-${now.month}-${now.day}-${now.hour}-${now.minute}`;

  return {
    now,
    currentMinutes,
    currentSeconds: now.second,
    timeFormatted: now.toFormat('HH:mm:ss'),
    dateFormatted: now.toFormat("EEEE, d 'de' MMMM", { locale: 'es' }),
    minuteKey
  };
}
