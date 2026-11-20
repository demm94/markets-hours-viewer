import { describe, it, expect } from 'vitest';
import {
  summarizeTimelineDaySegments,
  formatSegmentBarLabel,
  getSegmentTooltip,
  canShowInlineBarLabel,
  getSelectedDayEventsList,
  formatDurationMinutes,
  clampTimelineMinuteFromPointer,
  getTimelineActivityAtMinute,
  formatSegmentInspectionText,
  getTimelineLeftColumnSublabel,
  TimelineDaySummary
} from './timeline-schedule';
import { MARKETS } from './markets';
import { MarketEvaluation, TimelineSegment, TimelineEventMarkerData } from './types';

function makeEvent(
  overrides: Partial<TimelineEventMarkerData> & Pick<TimelineEventMarkerData, 'id' | 'marketId' | 'title' | 'minuteInChile'>
): TimelineEventMarkerData {
  return {
    category: 'central_bank',
    importance: 'high',
    timestampUtc: '2026-09-16T18:00:00Z',
    chileTimeFormatted: '15:00 (16 sep)',
    exchangeTimeFormatted: '14:00 (16 sep)',
    relativeTimeDescriptor: 'Hoy',
    leftPercent: (overrides.minuteInChile / 1440) * 100,
    ...overrides
  };
}

describe('timeline-schedule pure helpers', () => {
  describe('summarizeTimelineDaySegments', () => {
    it('summarizes a daytime regular session', () => {
      const segments: TimelineSegment[] = [
        { type: 'regular', startMinute: 690, endMinute: 1080, label: 'Sesión regular' }
      ];
      expect(summarizeTimelineDaySegments(segments)).toEqual({
        label: '11:30–18:00',
        kind: 'hours',
        isEarlyClose: false,
        hasLunchBreak: false
      });
    });

    it('ignores pre_market when summarizing open and close hours', () => {
      const segments: TimelineSegment[] = [
        { type: 'pre_market', startMinute: 30, endMinute: 45, label: 'Pre-apertura' },
        { type: 'regular', startMinute: 45, endMinute: 420, label: 'Sesión continua' }
      ];
      expect(summarizeTimelineDaySegments(segments)).toEqual({
        label: '00:45–07:00',
        kind: 'hours',
        isEarlyClose: false,
        hasLunchBreak: false
      });
    });

    it('reconstructs midnight-wrapped overnight sessions into open–close format', () => {
      const segments: TimelineSegment[] = [
        { type: 'regular', startMinute: 0, endMinute: 150, label: 'Sesión continua' },
        { type: 'regular', startMinute: 1320, endMinute: 1440, label: 'Sesión continua' }
      ];
      expect(summarizeTimelineDaySegments(segments)).toEqual({
        label: '22:00–02:30',
        kind: 'hours',
        isEarlyClose: false,
        hasLunchBreak: false
      });
    });

    it('summarizes midnight-wrapped sessions with a lunch break in summer', () => {
      const segments: TimelineSegment[] = [
        { type: 'regular', startMinute: 0, endMinute: 30, label: 'Sesión mañana' },
        { type: 'lunch', startMinute: 30, endMinute: 120, label: 'Almuerzo' },
        { type: 'regular', startMinute: 120, endMinute: 240, label: 'Sesión tarde' },
        { type: 'regular', startMinute: 1350, endMinute: 1440, label: 'Sesión mañana' }
      ];
      expect(summarizeTimelineDaySegments(segments)).toEqual({
        label: '22:30–04:00',
        kind: 'hours',
        isEarlyClose: false,
        hasLunchBreak: true
      });
    });

    it('summarizes midnight-wrapped sessions when lunch crosses midnight in winter', () => {
      const segments: TimelineSegment[] = [
        { type: 'lunch', startMinute: 0, endMinute: 60, label: 'Almuerzo' },
        { type: 'regular', startMinute: 60, endMinute: 180, label: 'Sesión tarde' },
        { type: 'regular', startMinute: 1290, endMinute: 1410, label: 'Sesión mañana' },
        { type: 'lunch', startMinute: 1410, endMinute: 1440, label: 'Almuerzo' }
      ];
      expect(summarizeTimelineDaySegments(segments)).toEqual({
        label: '21:30–03:00',
        kind: 'hours',
        isEarlyClose: false,
        hasLunchBreak: true
      });
    });

    it('formats Sunday evening open-only sessions', () => {
      const segments: TimelineSegment[] = [
        { type: 'regular', startMinute: 1320, endMinute: 1440, label: 'Sesión continua' }
      ];
      expect(summarizeTimelineDaySegments(segments)).toEqual({
        label: '22:00–24:00',
        kind: 'open_only',
        isEarlyClose: false,
        hasLunchBreak: false
      });
    });

    it('formats Friday morning close-only sessions', () => {
      const segments: TimelineSegment[] = [
        { type: 'regular', startMinute: 0, endMinute: 150, label: 'Sesión continua' }
      ];
      expect(summarizeTimelineDaySegments(segments)).toEqual({
        label: '00:00–02:30',
        kind: 'close_only',
        isEarlyClose: false,
        hasLunchBreak: false
      });
    });

    it('handles mixed overnight holiday + active half correctly', () => {
      const morningHolidayEveningOpen: TimelineSegment[] = [
        {
          type: 'regular',
          startMinute: 0,
          endMinute: 150,
          holiday: { marketId: 'twse', date: '2026-09-28', name: 'Feriado Local' }
        },
        { type: 'regular', startMinute: 1320, endMinute: 1440, label: 'Sesión continua' }
      ];
      expect(summarizeTimelineDaySegments(morningHolidayEveningOpen)).toEqual({
        label: '22:00–24:00',
        kind: 'open_only',
        isEarlyClose: false,
        hasLunchBreak: false
      });

      const morningActiveEveningHoliday: TimelineSegment[] = [
        { type: 'regular', startMinute: 0, endMinute: 150, label: 'Sesión continua' },
        {
          type: 'regular',
          startMinute: 1320,
          endMinute: 1440,
          holiday: { marketId: 'twse', date: '2026-09-29', name: 'Feriado Local' }
        }
      ];
      expect(summarizeTimelineDaySegments(morningActiveEveningHoliday)).toEqual({
        label: '00:00–02:30',
        kind: 'close_only',
        isEarlyClose: false,
        hasLunchBreak: false
      });
    });

    it('detects all-day full holidays', () => {
      const segments: TimelineSegment[] = [
        {
          type: 'regular',
          startMinute: 690,
          endMinute: 1080,
          holiday: { marketId: 'nyse', date: '2026-11-26', name: 'Thanksgiving Day' }
        }
      ];
      expect(summarizeTimelineDaySegments(segments)).toEqual({
        label: 'Feriado',
        kind: 'holiday',
        isEarlyClose: false,
        holidayName: 'Thanksgiving Day',
        hasLunchBreak: false
      });
    });

    it('summarizes early-close holidays with shortened Chile hours and metadata', () => {
      const segments: TimelineSegment[] = [
        {
          type: 'regular',
          startMinute: 690,
          endMinute: 900,
          holiday: {
            marketId: 'nyse',
            date: '2026-11-27',
            name: 'Thanksgiving Day',
            isEarlyClose: true,
            closeTime: '13:00'
          }
        }
      ];
      expect(summarizeTimelineDaySegments(segments)).toEqual({
        label: '11:30–15:00',
        kind: 'hours',
        isEarlyClose: true,
        holidayName: 'Thanksgiving Day',
        hasLunchBreak: false
      });
    });

    it('returns closed when there are no segments (weekend)', () => {
      expect(summarizeTimelineDaySegments([])).toEqual({
        label: 'Cerrado',
        kind: 'closed',
        isEarlyClose: false,
        hasLunchBreak: false
      });
    });
  });

  describe('formatSegmentBarLabel', () => {
    it('formats interior, morning-tail, evening-open, and full-day bars', () => {
      expect(formatSegmentBarLabel({ type: 'regular', startMinute: 690, endMinute: 1080 })).toBe('11:30–18:00');
      expect(formatSegmentBarLabel({ type: 'regular', startMinute: 0, endMinute: 150 })).toBe('→ 02:30');
      expect(formatSegmentBarLabel({ type: 'regular', startMinute: 1320, endMinute: 1440 })).toBe('22:00 →');
      expect(formatSegmentBarLabel({ type: 'regular', startMinute: 0, endMinute: 1440 })).toBe('00:00–24:00');
    });
  });

  describe('getSegmentTooltip', () => {
    it('builds descriptive Chile-time tooltips for each segment type and holiday state', () => {
      expect(
        getSegmentTooltip('EE.UU.', {
          type: 'regular',
          startMinute: 690,
          endMinute: 1080,
          holiday: { marketId: 'nyse', date: '2026-11-26', name: 'Thanksgiving Day' }
        })
      ).toContain('Feriado: Thanksgiving Day');

      expect(
        getSegmentTooltip('EE.UU.', {
          type: 'regular',
          startMinute: 690,
          endMinute: 900,
          holiday: {
            marketId: 'nyse',
            date: '2026-11-27',
            name: 'Thanksgiving Day',
            isEarlyClose: true,
            closeTime: '13:00'
          }
        })
      ).toContain('11:30–15:00 CL');

      expect(
        getSegmentTooltip('China', {
          type: 'lunch',
          startMinute: 30,
          endMinute: 120
        })
      ).toContain('Almuerzo: 00:30–02:00 CL');

      expect(
        getSegmentTooltip('India', {
          type: 'pre_market',
          startMinute: 30,
          endMinute: 45
        })
      ).toContain('Pre-apertura: 00:30–00:45 CL');

      expect(
        getSegmentTooltip('Taiwán', {
          type: 'regular',
          startMinute: 1320,
          endMinute: 1440
        })
      ).toContain('22:00–24:00 CL');
    });
  });

  describe('canShowInlineBarLabel', () => {
    it('hides labels on non-regular and full-holiday segments', () => {
      expect(canShowInlineBarLabel({ type: 'lunch', startMinute: 30, endMinute: 240 }, [])).toEqual({
        desktop: false,
        mobile: false
      });
      expect(canShowInlineBarLabel({ type: 'pre_market', startMinute: 0, endMinute: 240 }, [])).toEqual({
        desktop: false,
        mobile: false
      });
      expect(
        canShowInlineBarLabel(
          {
            type: 'regular',
            startMinute: 600,
            endMinute: 1000,
            holiday: { marketId: 'nyse', date: '2026-11-26', name: 'Thanksgiving Day' }
          },
          []
        )
      ).toEqual({ desktop: false, mobile: false });
    });

    it('shows on both desktop and mobile for wide regular bars (>= 14%) without colliding events', () => {
      const nyse: TimelineSegment = { type: 'regular', startMinute: 630, endMinute: 1020 }; // 27.08%
      expect(canShowInlineBarLabel(nyse, [])).toEqual({ desktop: true, mobile: true });
    });

    it('shows only on desktop for medium regular bars (8% to <14%) without colliding events', () => {
      const twoHourBar: TimelineSegment = { type: 'regular', startMinute: 120, endMinute: 240 }; // 8.33%
      expect(canShowInlineBarLabel(twoHourBar, [])).toEqual({ desktop: true, mobile: false });
    });

    it('hides on both for narrow regular bars (< 8%)', () => {
      const shortBar: TimelineSegment = { type: 'regular', startMinute: 0, endMinute: 60 }; // 4.17%
      expect(canShowInlineBarLabel(shortBar, [])).toEqual({ desktop: false, mobile: false });
    });

    it('hides label when an event pin collides with bar center or overlaps a <18% bar', () => {
      const wideBar: TimelineSegment = { type: 'regular', startMinute: 630, endMinute: 1020 }; // 43.75%..70.83%, center 57.29%
      const centerEvent = makeEvent({
        id: 'e1',
        marketId: 'nyse',
        title: 'FOMC',
        minuteInChile: 840 // 58.33% -> |58.33 - 57.29| = 1.04 < 6.5
      });
      expect(canShowInlineBarLabel(wideBar, [centerEvent])).toEqual({ desktop: false, mobile: false });

      const edgeEventOnWideBar = makeEvent({
        id: 'e2',
        marketId: 'nyse',
        title: 'IPC',
        minuteInChile: 630 // 43.75% -> |43.75 - 57.29| = 13.54 >= 6.5, bar >= 18%
      });
      expect(canShowInlineBarLabel(wideBar, [edgeEventOnWideBar])).toEqual({ desktop: true, mobile: true });

      const mediumNarrowBar: TimelineSegment = { type: 'regular', startMinute: 1200, endMinute: 1440 }; // 16.67% (< 18%)
      const overlapEvent = makeEvent({
        id: 'e3',
        marketId: 'twse',
        title: 'CBC',
        minuteInChile: 1210 // near start edge of <18% bar
      });
      expect(canShowInlineBarLabel(mediumNarrowBar, [overlapEvent])).toEqual({
        desktop: false,
        mobile: false
      });
    });
  });

  describe('getSelectedDayEventsList', () => {
    it('flattens all market keys including chile and sorts chronologically with high importance first', () => {
      const e1 = makeEvent({ id: '1', marketId: 'nyse', title: 'B Medium', minuteInChile: 600, importance: 'medium' });
      const e2 = makeEvent({ id: '2', marketId: 'chile', title: 'TPM Chile', minuteInChile: 600, importance: 'high' });
      const e3 = makeEvent({ id: '3', marketId: 'sse', title: 'PBoC', minuteInChile: 120, importance: 'high' });
      const e4 = makeEvent({ id: '4', marketId: 'twse', title: 'A Medium', minuteInChile: 600, importance: 'medium' });

      const sorted = getSelectedDayEventsList({
        nyse: [e1],
        chile: [e2],
        sse: [e3],
        twse: [e4]
      });

      expect(sorted.map((e) => e.id)).toEqual(['3', '2', '4', '1']);
    });

    it('returns an empty list when dailyEvents is empty or undefined', () => {
      expect(getSelectedDayEventsList({})).toEqual([]);
      expect(getSelectedDayEventsList(undefined)).toEqual([]);
    });
  });

  describe('formatDurationMinutes', () => {
    it('formats hours and minutes cleanly', () => {
      expect(formatDurationMinutes(390)).toBe('6h 30m');
      expect(formatDurationMinutes(120)).toBe('2h');
      expect(formatDurationMinutes(45)).toBe('45m');
      expect(formatDurationMinutes(0)).toBe('0m');
      expect(formatDurationMinutes(-10)).toBe('0m');
    });
  });

  describe('clampTimelineMinuteFromPointer', () => {
    it('maps pointer clientX within bounds to 5-minute snapped [0, 1440] values', () => {
      expect(clampTimelineMinuteFromPointer(100, 100, 800)).toBe(0);
      expect(clampTimelineMinuteFromPointer(500, 100, 800)).toBe(720);
      expect(clampTimelineMinuteFromPointer(900, 100, 800)).toBe(1440);
      expect(clampTimelineMinuteFromPointer(50, 100, 800)).toBe(0);
      expect(clampTimelineMinuteFromPointer(1200, 100, 800)).toBe(1440);
      expect(clampTimelineMinuteFromPointer(300, 100, 0)).toBeNull();
      // 1/3 of 1440 is 480; test 5-min snapping near 481 -> 480
      expect(clampTimelineMinuteFromPointer(100 + 800 * (481 / 1440), 100, 800)).toBe(480);
    });
  });

  describe('getTimelineActivityAtMinute', () => {
    const nyse = MARKETS.find((m) => m.id === 'nyse')!;
    const sse = MARKETS.find((m) => m.id === 'sse')!;
    const nse = MARKETS.find((m) => m.id === 'nse')!;
    const twse = MARKETS.find((m) => m.id === 'twse')!;
    const subset = [twse, sse, nse, nyse];

    it('classifies open, lunch, and pre_market markets and excludes full holidays', () => {
      const segments: Record<string, TimelineSegment[]> = {
        twse: [{ type: 'regular', startMinute: 0, endMinute: 150 }],
        sse: [
          { type: 'regular', startMinute: 0, endMinute: 30 },
          { type: 'lunch', startMinute: 30, endMinute: 120 },
          { type: 'regular', startMinute: 120, endMinute: 240 }
        ],
        nse: [
          { type: 'pre_market', startMinute: 30, endMinute: 45 },
          { type: 'regular', startMinute: 45, endMinute: 420 }
        ],
        nyse: [
          {
            type: 'regular',
            startMinute: 690,
            endMinute: 1080,
            holiday: { marketId: 'nyse', date: '2026-11-26', name: 'Thanksgiving Day' }
          }
        ]
      };

      const at35 = getTimelineActivityAtMinute(35, subset, segments);
      expect(at35.timeLabel).toBe('00:35 CL');
      expect(at35.openMarkets.map((m) => m.id)).toEqual(['twse']);
      expect(at35.lunchMarkets.map((m) => m.id)).toEqual(['sse']);
      expect(at35.preMarketMarkets.map((m) => m.id)).toEqual(['nse']);
      expect(at35.activeMarketIds).toEqual(['twse', 'sse', 'nse']);

      // Full holiday NYSE is excluded even inside its regular hour range
      const at800 = getTimelineActivityAtMinute(800, subset, segments);
      expect(at800.timeLabel).toBe('13:20 CL');
      expect(at800.openMarkets).toEqual([]);
      expect(at800.lunchMarkets).toEqual([]);
      expect(at800.preMarketMarkets).toEqual([]);
      expect(at800.activeMarketIds).toEqual([]);
    });

    it('handles minute 1440 boundary cleanly', () => {
      const segments: Record<string, TimelineSegment[]> = {
        twse: [{ type: 'regular', startMinute: 1320, endMinute: 1440 }]
      };
      const atEnd = getTimelineActivityAtMinute(1440, [twse], segments);
      expect(atEnd.timeLabel).toBe('24:00 CL');
      expect(atEnd.openMarkets.map((m) => m.id)).toEqual(['twse']);
      expect(atEnd.activeMarketIds).toEqual(['twse']);
    });
  });

  describe('formatSegmentInspectionText', () => {
    const nyse = MARKETS.find((m) => m.id === 'nyse')!;
    const sse = MARKETS.find((m) => m.id === 'sse')!;
    const nse = MARKETS.find((m) => m.id === 'nse')!;
    const twse = MARKETS.find((m) => m.id === 'twse')!;

    it('formats regular, lunch, pre_market, early-close, full-holiday, and 24:00 overnight segments', () => {
      expect(
        formatSegmentInspectionText(nyse, { type: 'regular', startMinute: 690, endMinute: 1080 })
      ).toBe('🇺🇸 EE.UU. · 11:30–18:00 CL (6h 30m)');

      expect(
        formatSegmentInspectionText(sse, { type: 'lunch', startMinute: 30, endMinute: 120 })
      ).toBe('🇨🇳 China · Almuerzo 00:30–02:00 CL (1h 30m)');

      expect(
        formatSegmentInspectionText(nse, { type: 'pre_market', startMinute: 30, endMinute: 45 })
      ).toBe('🇮🇳 India · Pre-apertura 00:30–00:45 CL (15m)');

      expect(
        formatSegmentInspectionText(nyse, {
          type: 'regular',
          startMinute: 690,
          endMinute: 900,
          holiday: {
            marketId: 'nyse',
            date: '2026-11-27',
            name: 'Thanksgiving Day',
            isEarlyClose: true,
            closeTime: '13:00'
          }
        })
      ).toBe('🇺🇸 EE.UU. · Cierre temprano 11:30–15:00 CL (3h 30m) · Thanksgiving Day');

      expect(
        formatSegmentInspectionText(nyse, {
          type: 'regular',
          startMinute: 690,
          endMinute: 1080,
          holiday: { marketId: 'nyse', date: '2026-11-26', name: 'Thanksgiving Day' }
        })
      ).toBe('🇺🇸 EE.UU. · Feriado: Thanksgiving Day');

      expect(
        formatSegmentInspectionText(twse, { type: 'regular', startMinute: 1320, endMinute: 1440 })
      ).toBe('🇹🇼 Taiwán · 22:00–24:00 CL (2h)');
    });
  });

  describe('getTimelineLeftColumnSublabel', () => {
    const baseSummary: TimelineDaySummary = {
      label: '11:30–18:00',
      kind: 'hours',
      isEarlyClose: false,
      hasLunchBreak: false
    };

    const makeEval = (
      status: MarketEvaluation['status'],
      formattedCountdown?: string
    ): MarketEvaluation => ({
      marketId: 'nyse',
      status,
      localTimeFormatted: '12:00',
      localDateFormatted: 'vie 20 nov',
      ...(formattedCountdown
        ? {
            nextTransition: {
              type: status === 'lunch' ? 'resume' : status === 'pre_market' ? 'open' : 'close',
              inMinutes: 135,
              formattedCountdown
            }
          }
        : {})
    });

    it('returns live countdown when showLiveStatus is true and market is open, lunch, or pre_market', () => {
      expect(getTimelineLeftColumnSublabel(baseSummary, makeEval('open', 'Cierra en 2h 15m'), true)).toBe(
        'Cierra en 2h 15m'
      );
      expect(getTimelineLeftColumnSublabel(baseSummary, makeEval('lunch', 'Reanuda en 45m'), true)).toBe(
        'Reanuda en 45m'
      );
      expect(getTimelineLeftColumnSublabel(baseSummary, makeEval('pre_market', 'Abre en 10m'), true)).toBe(
        'Abre en 10m'
      );
    });

    it('returns unambiguous Chile time range when market is closed', () => {
      const fridayMorningSummary: TimelineDaySummary = {
        label: '00:00–02:30',
        kind: 'close_only',
        isEarlyClose: false,
        hasLunchBreak: false
      };
      expect(
        getTimelineLeftColumnSublabel(fridayMorningSummary, makeEval('closed', 'Abre dom 22:00 CL'), true)
      ).toBe('00:00–02:30');
    });

    it('returns summary label when showLiveStatus is false (future day or simulation)', () => {
      expect(getTimelineLeftColumnSublabel(baseSummary, makeEval('open', 'Cierra en 2h 15m'), false)).toBe(
        '11:30–18:00'
      );
    });

    it('always returns Feriado for holiday days and falls back to summary label when nextTransition is missing', () => {
      const holidaySummary: TimelineDaySummary = {
        label: 'Feriado',
        kind: 'holiday',
        isEarlyClose: false,
        holidayName: 'Thanksgiving Day',
        hasLunchBreak: false
      };
      expect(getTimelineLeftColumnSublabel(holidaySummary, makeEval('open', 'Cierra en 2h 15m'), true)).toBe(
        'Feriado'
      );
      expect(getTimelineLeftColumnSublabel(baseSummary, makeEval('open'), true)).toBe('11:30–18:00');
      expect(getTimelineLeftColumnSublabel(baseSummary, undefined, true)).toBe('11:30–18:00');
    });
  });
});
