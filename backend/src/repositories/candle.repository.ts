import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Candle, CandlesBySymbol } from "../models/candle";

type Warn = (message: string) => void;

const DEFAULT_DATASET_PATH = resolve(__dirname, "../../dataset/candles_1m.json");

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function toCandle(raw: unknown): Candle | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { symbol, ts, open, high, low, close, volume } = raw as Record<string, unknown>;

  if (typeof symbol !== "string" || symbol === "") return null;
  if (typeof ts !== "string" || Number.isNaN(Date.parse(ts))) return null;
  if (![open, high, low, close, volume].every(isFiniteNumber)) return null;

  const candle = { symbol, ts, open, high, low, close, volume } as Candle;
  if (candle.low > candle.high || candle.volume < 0) return null;
  return candle;
}

const sameValues = (a: Candle, b: Candle) =>
  a.open === b.open && a.high === b.high && a.low === b.low && a.close === b.close && a.volume === b.volume;

export function parseCandles(raw: unknown, warn: Warn = console.warn): CandlesBySymbol {
  if (!Array.isArray(raw)) throw new Error("Candle dataset must be a JSON array");

  const byKey = new Map<string, Candle>();
  let skipped = 0;

  for (const item of raw) {
    const candle = toCandle(item);
    if (!candle) {
      skipped++;
      continue;
    }

    const key = `${candle.symbol} ${candle.ts}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, candle);
    } else if (!sameValues(existing, candle)) {
      warn(`Conflicting duplicate candle for ${key}; keeping the first one`);
    }
  }

  if (skipped > 0) warn(`Skipped ${skipped} invalid candle row(s)`);

  const bySymbol: CandlesBySymbol = new Map();
  for (const candle of byKey.values()) {
    const list = bySymbol.get(candle.symbol) ?? [];
    list.push(candle);
    bySymbol.set(candle.symbol, list);
  }
  for (const list of bySymbol.values()) {
    list.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  }
  return bySymbol;
}

export function loadCandles(path: string = process.env.DATASET_PATH ?? DEFAULT_DATASET_PATH): CandlesBySymbol {
  const fullPath = resolve(path);
  if (!existsSync(fullPath)) throw new Error(`Candle dataset not found at ${fullPath}`);

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(fullPath, "utf8"));
  } catch (error) {
    throw new Error(`Candle dataset at ${fullPath} is not valid JSON: ${(error as Error).message}`);
  }
  return parseCandles(raw);
}
