import type { Candle, CandlesBySymbol } from "../models/candle";
import { aggregate } from "./aggregate";
import { TIMEFRAMES, type Timeframe } from "./timeframes";

export class SymbolNotFoundError extends Error {
  constructor(symbol: string, available: string[]) {
    const upper = symbol.toUpperCase();
    const hint = upper !== symbol && available.includes(upper) ? ` Did you mean "${upper}"?` : "";
    super(`Unknown symbol "${symbol}".${hint} Available: ${available.join(", ")}`);
    this.name = "SymbolNotFoundError";
  }
}

export function createCandleService(data: CandlesBySymbol) {
  function getCandles(symbol: string, tf: Timeframe): Candle[] {
    const candles = data.get(symbol);
    if (!candles) throw new SymbolNotFoundError(symbol, [...data.keys()].sort());
    return tf === "1m" ? candles : aggregate(candles, TIMEFRAMES[tf]);
  }

  return { getCandles };
}
