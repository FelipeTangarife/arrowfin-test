export const INSTRUMENTS = {
  MES: "Micro E-mini S&P 500",
  NQ: "E-mini Nasdaq-100",
} as const;

export const SYMBOLS = Object.keys(INSTRUMENTS) as Ticker[];
export const TIMEFRAMES = ["1m", "5m", "15m", "1h"] as const;

export type Ticker = keyof typeof INSTRUMENTS;
export type Timeframe = (typeof TIMEFRAMES)[number];
