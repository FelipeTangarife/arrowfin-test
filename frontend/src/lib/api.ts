import type { Ticker, Timeframe } from "./constants";

export interface Candle {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface CandlesResponse {
  symbol: string;
  tf: string;
  candles: Candle[];
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.error?.message === "string") return body.error.message;
  } catch {
    // Not our JSON error shape, e.g. the Next proxy failing because the backend is down.
  }
  return `The API is unavailable (HTTP ${res.status}). Is the backend running?`;
}

export async function fetchCandles(symbol: Ticker, tf: Timeframe, signal?: AbortSignal): Promise<Candle[]> {
  const params = new URLSearchParams({ symbol, tf });
  let res: Response;
  try {
    res = await fetch(`/api/candles?${params}`, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("Cannot reach the server. Check your connection.");
  }

  if (!res.ok) throw new Error(await errorMessage(res));
  const body: CandlesResponse = await res.json();
  return body.candles;
}
