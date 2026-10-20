import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { Candle } from "../src/models/candle";
import { loadCandles } from "../src/repositories/candle.repository";
import { createCandleService } from "../src/services/candle.service";

const { getCandles } = createCandleService(loadCandles());
const at = (candles: Candle[], ts: string) => candles.find((c) => c.ts === ts);

describe("getCandles", () => {
  it("matches the MES 5m 14:00 reference values", () => {
    expect(at(getCandles("MES", "5m"), "2026-08-25T14:00:00Z")).toEqual({
      symbol: "MES",
      ts: "2026-08-25T14:00:00Z",
      open: 5635.75,
      high: 5636.75,
      low: 5627.5,
      close: 5628.75,
      volume: 9940,
    });
  });

  it("does not count duplicate rows in MES 5m 14:10", () => {
    const raw: Candle[] = JSON.parse(readFileSync(resolve(__dirname, "../dataset/candles_1m.json"), "utf8"));
    const bucket = raw.filter((r) => r.symbol === "MES" && r.ts >= "2026-08-25T14:10" && r.ts < "2026-08-25T14:15");
    const unique = new Map(bucket.map((r) => [r.ts, r]));
    const volumeByHand = [...unique.values()].reduce((sum, r) => sum + r.volume, 0);

    expect(bucket.length).toBeGreaterThan(unique.size);
    expect(volumeByHand).toBe(9896);
    expect(at(getCandles("MES", "5m"), "2026-08-25T14:10:00Z")?.volume).toBe(volumeByHand);
  });

  it("builds NQ 5m 15:45 only from the minutes that exist", () => {
    expect(at(getCandles("NQ", "5m"), "2026-08-25T15:45:00Z")).toEqual({
      symbol: "NQ",
      ts: "2026-08-25T15:45:00Z",
      open: 19645.75,
      high: 19649,
      low: 19638.5,
      close: 19644,
      volume: 609,
    });

    const totalVolume = (candles: Candle[]) => candles.reduce((sum, c) => sum + c.volume, 0);
    expect(totalVolume(getCandles("NQ", "5m"))).toBe(totalVolume(getCandles("NQ", "1m")));
  });

  it("fails for an unknown symbol and lists the available ones", () => {
    expect(() => getCandles("ES", "5m")).toThrow('Unknown symbol "ES". Available: MES, NQ');
  });
});
