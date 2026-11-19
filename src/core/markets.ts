import { MarketConfig } from './types';

export const CHILE_CONFIG = {
  id: 'chile',
  name: 'Chile (Referencia)',
  code: 'STGO',
  country: 'Chile',
  flag: '🇨🇱',
  timezone: 'America/Santiago'
};

export const MARKETS: MarketConfig[] = [
  {
    id: 'twse',
    name: 'Taiwán',
    code: 'TWSE',
    country: 'Taiwán',
    flag: '🇹🇼',
    timezone: 'Asia/Taipei',
    sessions: [
      { type: 'regular', start: '09:00', end: '13:30', label: 'Sesión continua' }
    ],
    notes: 'UTC+8 sin cambio de hora. Sin pausa de almuerzo.'
  },
  {
    id: 'krx',
    name: 'Corea del Sur',
    code: 'KRX',
    country: 'Corea del Sur',
    flag: '🇰🇷',
    timezone: 'Asia/Seoul',
    sessions: [
      { type: 'regular', start: '09:00', end: '15:30', label: 'Sesión continua' }
    ],
    notes: 'UTC+9 sin cambio de hora. Sin pausa de almuerzo.'
  },
  {
    id: 'sse',
    name: 'China',
    code: 'SSE / SZSE',
    country: 'China',
    flag: '🇨🇳',
    timezone: 'Asia/Shanghai',
    sessions: [
      { type: 'regular', start: '09:30', end: '11:30', label: 'Sesión mañana' },
      { type: 'lunch', start: '11:30', end: '13:00', label: 'Almuerzo' },
      { type: 'regular', start: '13:00', end: '15:00', label: 'Sesión tarde' }
    ],
    notes: 'UTC+8 sin cambio de hora. Pausa de almuerzo de 11:30 a 13:00 (hora local).'
  },
  {
    id: 'nse',
    name: 'India',
    code: 'NSE / BSE',
    country: 'India',
    flag: '🇮🇳',
    timezone: 'Asia/Kolkata',
    sessions: [
      { type: 'pre_market', start: '09:00', end: '09:15', label: 'Pre-apertura' },
      { type: 'regular', start: '09:15', end: '15:30', label: 'Sesión continua' }
    ],
    notes: 'UTC+5:30 sin cambio de hora. Pre-apertura de 09:00 a 09:15 (hora local).'
  },
  {
    id: 'nyse',
    name: 'EE.UU.',
    code: 'NYSE / NASDAQ',
    country: 'Estados Unidos',
    flag: '🇺🇸',
    timezone: 'America/New_York',
    sessions: [
      { type: 'regular', start: '09:30', end: '16:00', label: 'Sesión regular' }
    ],
    notes: 'Cambio de hora estacional opuesto al de Chile.'
  }
];
