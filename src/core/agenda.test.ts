import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { CHILE_TZ } from './timezone';
import { MarketEvent, MarketHoliday, UnifiedEventAgendaItem } from './types';
import {
  buildMonthCalendarGrid,
  getHolidaysForIsoDate,
  getRangeWindowLabel,
  getUnifiedAgendaItems,
  getUpcomingStripPreview,
  groupAgendaItemsByDate,
  toTimelineEventMarkerData
} from './agenda';

const SAMPLE_EVENTS: MarketEvent[] = [
  {
    id: 'evt-past-nov',
    marketId: 'nyse',
    title: 'Past November CPI',
    category: 'inflation',
    importance: 'high',
    timestampUtc: '2026-11-12T13:30:00Z'
  },
  {
    id: 'evt-today-medium',
    marketId: 'nyse',
    title: 'Today PMI Flash',
    category: 'gdp',
    importance: 'medium',
    timestampUtc: '2026-11-23T14:45:00Z' // 11:45 CL
  },
  {
    id: 'evt-same-day-late',
    marketId: 'nyse',
    title: 'FOMC Minutes',
    category: 'central_bank',
    importance: 'high',
    timestampUtc: '2026-11-26T19:00:00Z' // 16:00 CL
  },
  {
    id: 'evt-same-day-early',
    marketId: 'krx',
    title: 'BoK Rate Decision',
    category: 'central_bank',
    importance: 'high',
    timestampUtc: '2026-11-26T01:00:00Z' // 2026-11-25 22:00 CL
  },
  {
    id: 'evt-same-day-mid',
    marketId: 'chile',
    title: 'Encuesta BCCh',
    category: 'central_bank',
    importance: 'medium',
    timestampUtc: '2026-11-26T11:30:00Z' // 08:30 CL
  },
  {
    id: 'evt-dec-10',
    marketId: 'nyse',
    title: 'US CPI Dec',
    category: 'inflation',
    importance: 'high',
    timestampUtc: '2026-12-10T13:30:00Z'
  },
  {
    id: 'evt-jan-next-year',
    marketId: 'nyse',
    title: 'US NFP Jan 2027',
    category: 'employment',
    importance: 'high',
    timestampUtc: '2027-01-08T13:30:00Z'
  }
];

const SAMPLE_HOLIDAYS: MarketHoliday[] = [
  {
    marketId: 'chile',
    date: '2026-11-01',
    name: 'Todos los Santos'
  },
  {
    marketId: 'nyse',
    date: '2026-11-26',
    name: 'Thanksgiving Day'
  },
  {
    marketId: 'nyse',
    date: '2026-11-27',
    name: 'Black Friday (Cierre temprano)',
    isEarlyClose: true,
    closeTime: '13:00'
  },
  {
    marketId: 'chile',
    date: '2026-11-26',
    name: 'Cierre especial local',
    isEarlyClose: true,
    closeTime: '12:30'
  },
  {
    marketId: 'chile',
    date: '2026-12-08',
    name: 'Inmaculada Concepción'
  },
  {
    marketId: 'nyse',
    date: '2027-01-01',
    name: "New Year's Day"
  }
];

describe('unified agenda engine', () => {
  const nov23Now = DateTime.fromISO('2026-11-23T10:00:00', { zone: CHILE_TZ });

  describe('getUnifiedAgendaItems', () => {
    it('returns today + 6 days inclusive for week range', () => {
      const items = getUnifiedAgendaItems(nov23Now, {
        range: 'week',
        events: SAMPLE_EVENTS,
        holidays: SAMPLE_HOLIDAYS
      });

      const dates = items.map((i) => i.isoDate);
      expect(dates).not.toContain('2026-11-12');
      expect(dates).not.toContain('2026-12-08');
      expect(dates).toContain('2026-11-23');
      expect(dates).toContain('2026-11-25');
      expect(dates).toContain('2026-11-26');
      expect(dates).toContain('2026-11-27');
    });

    it('hides past days in current month by default, and includes them when includePastInCurrentMonth is true', () => {
      const defaultMonthItems = getUnifiedAgendaItems(nov23Now, {
        range: 'month',
        viewedMonth: { year: 2026, month: 11 },
        events: SAMPLE_EVENTS,
        holidays: SAMPLE_HOLIDAYS
      });
      expect(defaultMonthItems.some((i) => i.isoDate === '2026-11-01')).toBe(false);
      expect(defaultMonthItems.some((i) => i.isoDate === '2026-11-12')).toBe(false);
      expect(defaultMonthItems.some((i) => i.isoDate === '2026-11-26')).toBe(true);

      const fullMonthItems = getUnifiedAgendaItems(nov23Now, {
        range: 'month',
        viewedMonth: { year: 2026, month: 11 },
        includePastInCurrentMonth: true,
        events: SAMPLE_EVENTS,
        holidays: SAMPLE_HOLIDAYS
      });
      expect(fullMonthItems.some((i) => i.isoDate === '2026-11-01')).toBe(true);
      expect(fullMonthItems.some((i) => i.isoDate === '2026-11-12')).toBe(true);
    });

    it('starts future month from day 1 and handles year rollover cleanly', () => {
      const decItems = getUnifiedAgendaItems(nov23Now, {
        range: 'month',
        viewedMonth: { year: 2026, month: 12 },
        events: SAMPLE_EVENTS,
        holidays: SAMPLE_HOLIDAYS
      });
      expect(decItems.map((i) => i.isoDate)).toEqual(['2026-12-08', '2026-12-10']);

      const jan2027Items = getUnifiedAgendaItems(nov23Now, {
        range: 'month',
        viewedMonth: { year: 2027, month: 1 },
        events: SAMPLE_EVENTS,
        holidays: SAMPLE_HOLIDAYS
      });
      expect(jan2027Items.map((i) => i.isoDate)).toEqual(['2027-01-01', '2027-01-08']);
    });

    it('covers up to 90 days ahead in quarter range', () => {
      const quarterItems = getUnifiedAgendaItems(nov23Now, {
        range: 'quarter',
        events: SAMPLE_EVENTS,
        holidays: SAMPLE_HOLIDAYS
      });
      expect(quarterItems.some((i) => i.isoDate === '2027-01-08')).toBe(true);
      expect(quarterItems.some((i) => i.isoDate === '2026-11-12')).toBe(false);
    });

    it('sorts deterministically: holidays before events, full closures before early closes, events by minuteInChile', () => {
      const items = getUnifiedAgendaItems(nov23Now, {
        range: 'week',
        events: SAMPLE_EVENTS,
        holidays: SAMPLE_HOLIDAYS
      });

      const nov26Items = items.filter((i) => i.isoDate === '2026-11-26');
      expect(nov26Items).toHaveLength(4);
      // 1. Full holiday (NYSE Thanksgiving)
      expect(nov26Items[0].kind).toBe('holiday');
      expect(nov26Items[0].id).toBe('holiday-nyse-2026-11-26');
      // 2. Early close (Chile 12:30)
      expect(nov26Items[1].kind).toBe('holiday');
      expect(nov26Items[1].id).toBe('holiday-chile-2026-11-26');
      // 3. Earlier event (08:30 CL)
      expect(nov26Items[2].kind).toBe('event');
      expect(nov26Items[2].id).toBe('evt-same-day-mid');
      // 4. Later event (16:00 CL)
      expect(nov26Items[3].kind).toBe('event');
      expect(nov26Items[3].id).toBe('evt-same-day-late');
    });

    it('handles UTC-to-Chile midnight date rollover accurately', () => {
      // PBoC LPR 2026-09-20T01:15:00Z is 2026-09-19 22:15 in America/Santiago
      const sep18Now = DateTime.fromISO('2026-09-18T12:00:00', { zone: CHILE_TZ });
      const rolloverEvent: MarketEvent = {
        id: 'cn-pboc-rollover',
        marketId: 'sse',
        title: 'PBoC LPR',
        category: 'central_bank',
        importance: 'high',
        timestampUtc: '2026-09-20T01:15:00Z'
      };

      const items = getUnifiedAgendaItems(sep18Now, {
        range: 'week',
        events: [rolloverEvent],
        holidays: []
      });

      expect(items).toHaveLength(1);
      expect(items[0].isoDate).toBe('2026-09-19');
      expect((items[0] as UnifiedEventAgendaItem).minuteInChile).toBe(22 * 60 + 15);
    });

    it('filters by marketId, kind, and onlyHighImportance while preserving holidays when kind is all', () => {
      const highAll = getUnifiedAgendaItems(nov23Now, {
        range: 'week',
        kind: 'all',
        onlyHighImportance: true,
        events: SAMPLE_EVENTS,
        holidays: SAMPLE_HOLIDAYS
      });

      // Holidays remain visible in 'all' mode even with onlyHighImportance=true
      expect(highAll.some((i) => i.kind === 'holiday')).toBe(true);
      // Medium events are excluded
      expect(highAll.some((i) => i.id === 'evt-today-medium')).toBe(false);
      expect(highAll.some((i) => i.id === 'evt-same-day-mid')).toBe(false);
      // High events remain
      expect(highAll.some((i) => i.id === 'evt-same-day-late')).toBe(true);

      const chileHolidaysOnly = getUnifiedAgendaItems(nov23Now, {
        range: 'quarter',
        marketId: 'chile',
        kind: 'holidays',
        events: SAMPLE_EVENTS,
        holidays: SAMPLE_HOLIDAYS
      });
      expect(chileHolidaysOnly.every((i) => i.kind === 'holiday' && i.marketId === 'chile')).toBe(true);
      expect(chileHolidaysOnly).toHaveLength(2);
    });
  });

  describe('groupAgendaItemsByDate', () => {
    it('groups items into day sections with formatted Spanish headers and flags', () => {
      const items = getUnifiedAgendaItems(nov23Now, {
        range: 'week',
        events: SAMPLE_EVENTS,
        holidays: SAMPLE_HOLIDAYS
      });

      const groups = groupAgendaItemsByDate(items, nov23Now);
      expect(groups.map((g) => g.isoDate)).toEqual([
        '2026-11-23',
        '2026-11-25',
        '2026-11-26',
        '2026-11-27'
      ]);

      const todayGroup = groups[0];
      expect(todayGroup.isToday).toBe(true);
      expect(todayGroup.relativeDescriptor).toBe('Hoy');
      expect(todayGroup.dayLabel).toBe('Lun 23 Nov');
      expect(todayGroup.hasHighImpact).toBe(false);

      const nov26Group = groups[2];
      expect(nov26Group.relativeDays).toBe(3);
      expect(nov26Group.relativeDescriptor).toBe('En 3 días');
      expect(nov26Group.dayLabel).toBe('Jue 26 Nov');
      expect(nov26Group.hasFullHoliday).toBe(true);
      expect(nov26Group.hasEarlyClose).toBe(true);
      expect(nov26Group.hasHighImpact).toBe(true);
      expect(nov26Group.totalCount).toBe(4);
    });
  });

  describe('buildMonthCalendarGrid', () => {
    it('builds a Monday-first padded grid (35 or 42 cells) with per-day activity counts', () => {
      // November 2026 starts on Sunday Nov 1 -> 6 leading days -> 42 cells
      const fullNovItems = getUnifiedAgendaItems(nov23Now, {
        range: 'month',
        viewedMonth: { year: 2026, month: 11 },
        includePastInCurrentMonth: true,
        events: SAMPLE_EVENTS,
        holidays: SAMPLE_HOLIDAYS
      });
      const novGrid = buildMonthCalendarGrid(2026, 11, nov23Now, fullNovItems);
      expect(novGrid.monthLabel).toBe('Noviembre 2026');
      expect(novGrid.cells).toHaveLength(42);
      expect(novGrid.cells[0].isoDate).toBe('2026-10-26');
      expect(novGrid.cells[0].isCurrentMonth).toBe(false);

      const nov23Cell = novGrid.cells.find((c) => c.isoDate === '2026-11-23')!;
      expect(nov23Cell.isToday).toBe(true);
      expect(nov23Cell.mediumImpactCount).toBe(1);

      const nov26Cell = novGrid.cells.find((c) => c.isoDate === '2026-11-26')!;
      expect(nov26Cell.holidayCount).toBe(1);
      expect(nov26Cell.earlyCloseCount).toBe(1);
      expect(nov26Cell.highImpactCount).toBe(1);
      expect(nov26Cell.mediumImpactCount).toBe(1);
      expect(nov26Cell.totalCount).toBe(4);

      const nov12Cell = novGrid.cells.find((c) => c.isoDate === '2026-11-12')!;
      expect(nov12Cell.isPast).toBe(true);
      expect(nov12Cell.highImpactCount).toBe(1);

      // December 2026 starts on Tuesday Dec 1 and ends on Thursday Dec 31 -> 35 cells
      const decGrid = buildMonthCalendarGrid(2026, 12, nov23Now, []);
      expect(decGrid.cells).toHaveLength(35);
      expect(decGrid.cells[0].isoDate).toBe('2026-11-30');
    });
  });

  describe('getUpcomingStripPreview', () => {
    it('returns week items strictly after today when present', () => {
      const preview = getUpcomingStripPreview(nov23Now, {
        events: SAMPLE_EVENTS,
        holidays: SAMPLE_HOLIDAYS
      });

      expect(preview.weekItemsAfterToday.length).toBeGreaterThan(0);
      expect(preview.weekItemsAfterToday.every((i) => i.relativeDays >= 1)).toBe(true);
      expect(preview.nextUpcomingItem).toBeUndefined();
    });

    it('falls back to the nearest future item in 90 days when the week is quiet', () => {
      const dec01Now = DateTime.fromISO('2026-12-01T10:00:00', { zone: CHILE_TZ });
      const preview = getUpcomingStripPreview(dec01Now, {
        events: SAMPLE_EVENTS,
        holidays: SAMPLE_HOLIDAYS
      });

      expect(preview.weekItemsAfterToday).toHaveLength(0);
      expect(preview.nextUpcomingItem).toBeDefined();
      expect(preview.nextUpcomingItem?.isoDate).toBe('2026-12-08');
    });
  });

  describe('auxiliary helpers', () => {
    it('returns holidays sorted full-first via getHolidaysForIsoDate', () => {
      const holidays = getHolidaysForIsoDate('2026-11-26', SAMPLE_HOLIDAYS);
      expect(holidays).toHaveLength(2);
      expect(holidays[0].marketId).toBe('nyse');
      expect(holidays[1].marketId).toBe('chile');
    });

    it('formats range window labels for week, month, and quarter', () => {
      expect(getRangeWindowLabel('week', nov23Now)).toBe('23 Nov – 29 Nov');
      expect(getRangeWindowLabel('month', nov23Now, { year: 2026, month: 12 })).toBe('Diciembre 2026');
      expect(getRangeWindowLabel('quarter', nov23Now)).toBe('Próximos 90 días');
    });

    it('converts UnifiedEventAgendaItem to TimelineEventMarkerData cleanly', () => {
      const [item] = getUnifiedAgendaItems(nov23Now, {
        range: 'week',
        kind: 'events',
        events: [SAMPLE_EVENTS[1]],
        holidays: []
      }) as UnifiedEventAgendaItem[];

      const marker = toTimelineEventMarkerData(item);
      expect(marker.id).toBe('evt-today-medium');
      expect(marker.minuteInChile).toBe(11 * 60 + 45);
      expect(marker.leftPercent).toBeCloseTo(((11 * 60 + 45) / 1440) * 100, 4);
    });
  });
});
