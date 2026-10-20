import type { Candle } from "../models/candle";

const toIso = (ms: number) => new Date(ms).toISOString().replace(".000Z", "Z");

// Buckets align to the UTC clock, not the session start, so the first 1h candle (13:00) only covers 13:30-13:59.
// Buckets with no minutes are skipped, not filled.
export function aggregate(candles: Candle[], bucketMs: number): Candle[] {
  const result: Candle[] = [];
  let current: Candle | undefined;

  for (const candle of candles) {
    const ts = toIso(Math.floor(Date.parse(candle.ts) / bucketMs) * bucketMs);
    if (current?.ts === ts) {
      current.high = Math.max(current.high, candle.high);
      current.low = Math.min(current.low, candle.low);
      current.close = candle.close;
      current.volume += candle.volume;
    } else {
      current = { ...candle, ts };
      result.push(current);
    }
  }
  return result;
}
