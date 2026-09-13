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
    notes: 'UTC+8 sin DST. Sin corte de almuerzo.'
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
    notes: 'UTC+9 sin DST. Eliminó el almuerzo en el año 2000.'
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
    notes: 'UTC+8 sin DST. Pausa de almuerzo 11:30 a 13:00.'
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
    notes: 'UTC+5:30 sin DST. Pre-mercado 09:00 a 09:15.'
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
    notes: 'UTC-5 (invierno) / UTC-4 (verano, EDT). Cruce de DST opuesto a Chile.'
  }
];
