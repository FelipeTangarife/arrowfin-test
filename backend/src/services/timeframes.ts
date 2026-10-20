const MINUTE = 60_000;

export const TIMEFRAMES = {
  "1m": MINUTE,
  "5m": 5 * MINUTE,
  "15m": 15 * MINUTE,
  "1h": 60 * MINUTE,
} as const;

export type Timeframe = keyof typeof TIMEFRAMES;

export const isTimeframe = (value: string): value is Timeframe => Object.hasOwn(TIMEFRAMES, value);
