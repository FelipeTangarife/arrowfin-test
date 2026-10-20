import { useEffect, useState } from "react";
import { fetchCandles, type Candle } from "@/lib/api";
import type { Ticker, Timeframe } from "@/lib/constants";

export type CandlesState =
  | { status: "loading"; previous: Candle[] }
  | { status: "error"; message: string }
  | { status: "success"; candles: Candle[] };

type Settled = Exclude<CandlesState, { status: "loading" }> & { key: string };

export function useCandles(symbol: Ticker, tf: Timeframe): CandlesState & { retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled | null>(null);
  const key = `${symbol}:${tf}:${attempt}`;
  const retry = () => setAttempt((n) => n + 1);

  useEffect(() => {
    const controller = new AbortController();
    fetchCandles(symbol, tf, controller.signal)
      .then((candles) => setSettled({ key, status: "success", candles }))
      .catch((error: Error) => {
        if (!controller.signal.aborted) setSettled({ key, status: "error", message: error.message });
      });
    return () => controller.abort();
  }, [key, symbol, tf]);

  // A result for another selection is stale: the current one is still loading.
  if (settled?.key !== key) {
    return { status: "loading", previous: settled?.status === "success" ? settled.candles : [], retry };
  }
  return { ...settled, retry };
}
