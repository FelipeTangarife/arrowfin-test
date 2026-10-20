export interface Candle {
  symbol: string;
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type CandlesBySymbol = Map<string, Candle[]>;
