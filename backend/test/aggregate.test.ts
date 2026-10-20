import { describe, expect, it } from "vitest";
import { aggregate } from "../src/services/aggregate";
import { TIMEFRAMES } from "../src/services/timeframes";

const minute = (ts: string, open: number, high: number, low: number, close: number, volume: number) => ({
  symbol: "MES",
  ts,
  open,
  high,
  low,
  close,
  volume,
});

describe("aggregate", () => {
  it("builds one candle from the assignment example", () => {
    const result = aggregate(
      [
        minute("2026-08-25T14:05:00Z", 100, 101, 99.5, 100.5, 20),
        minute("2026-08-25T14:06:00Z", 100.5, 102, 100, 101, 10),
        minute("2026-08-25T14:07:00Z", 101, 101.5, 98, 99, 30),
      ],
      TIMEFRAMES["5m"],
    );

    expect(result).toEqual([minute("2026-08-25T14:05:00Z", 100, 102, 98, 99, 60)]);
  });
});
