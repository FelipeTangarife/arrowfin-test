import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { loadCandles, parseCandles } from "../src/repositories/candle.repository";

const row = (ts: string, overrides: Record<string, unknown> = {}) => ({
  symbol: "MES",
  ts,
  open: 100,
  high: 101,
  low: 99,
  close: 100.5,
  volume: 10,
  ...overrides,
});

describe("parseCandles", () => {
  it("groups by symbol and sorts each group by time", () => {
    const result = parseCandles([
      row("2026-08-25T13:32:00Z"),
      row("2026-08-25T13:31:00Z", { symbol: "NQ" }),
      row("2026-08-25T13:30:00Z"),
      row("2026-08-25T13:30:00Z", { symbol: "NQ" }),
    ]);

    expect([...result.keys()].sort()).toEqual(["MES", "NQ"]);
    expect(result.get("MES")!.map((c) => c.ts)).toEqual(["2026-08-25T13:30:00Z", "2026-08-25T13:32:00Z"]);
    expect(result.get("NQ")!.map((c) => c.ts)).toEqual(["2026-08-25T13:30:00Z", "2026-08-25T13:31:00Z"]);
  });

  it("removes exact duplicates without warning", () => {
    const warn = vi.fn();
    const result = parseCandles([row("2026-08-25T13:30:00Z"), row("2026-08-25T13:30:00Z")], warn);

    expect(result.get("MES")).toHaveLength(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it("keeps the first row when duplicates conflict and warns", () => {
    const warn = vi.fn();
    const result = parseCandles(
      [row("2026-08-25T13:30:00Z", { volume: 10 }), row("2026-08-25T13:30:00Z", { volume: 99 })],
      warn,
    );

    expect(result.get("MES")).toEqual([row("2026-08-25T13:30:00Z", { volume: 10 })]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("MES 2026-08-25T13:30:00Z");
  });

  it("skips broken rows with a single warning at the end", () => {
    const warn = vi.fn();
    const result = parseCandles(
      [
        row("2026-08-25T13:30:00Z"),
        row("2026-08-25T13:31:00Z", { open: "abc" }),
        row("2026-08-25T13:32:00Z", { low: 102, high: 101 }),
        row("2026-08-25T13:33:00Z", { volume: -1 }),
        row("not-a-date"),
        null,
      ],
      warn,
    );

    expect(result.get("MES")!.map((c) => c.ts)).toEqual(["2026-08-25T13:30:00Z"]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("5");
  });

  it("throws a clear error when the input is not an array", () => {
    expect(() => parseCandles({ candles: [] })).toThrow(/JSON array/);
  });
});

describe("loadCandles", () => {
  it("loads the real dataset with 388 MES and 384 NQ candles", () => {
    const result = loadCandles();

    expect(result.get("MES")).toHaveLength(388);
    expect(result.get("NQ")).toHaveLength(384);
  });

  it("throws a clear error when the file is missing", () => {
    expect(() => loadCandles(join(tmpdir(), "does-not-exist.json"))).toThrow(/not found/);
  });

  it("throws a clear error when the file is not a JSON array", () => {
    const file = join(mkdtempSync(join(tmpdir(), "candles-")), "bad.json");
    writeFileSync(file, '{"not":"an array"}');

    expect(() => loadCandles(file)).toThrow(/JSON array/);
  });
});
