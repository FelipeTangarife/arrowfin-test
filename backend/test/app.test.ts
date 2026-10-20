import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadCandles } from "../src/repositories/candle.repository";
import { createCandleService } from "../src/services/candle.service";

const app = createApp(createCandleService(loadCandles()));

describe("GET /candles", () => {
  it("returns MES 5m candles oldest first, starting at 13:30", async () => {
    const res = await request(app).get("/candles?symbol=MES&tf=5m");

    expect(res.status).toBe(200);
    expect(res.body.symbol).toBe("MES");
    expect(res.body.tf).toBe("5m");
    expect(res.body.candles[0]).toEqual({ t: "2026-08-25T13:30:00Z", o: expect.any(Number), h: expect.any(Number), l: expect.any(Number), c: expect.any(Number), v: expect.any(Number) });
    const times: string[] = res.body.candles.map((c: { t: string }) => c.t);
    expect(times).toEqual([...times].sort());
  });

  it("returns 400 when tf is missing", async () => {
    const res = await request(app).get("/candles?symbol=MES");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_PARAM");
    expect(res.body.error.message).toContain("tf");
  });

  it("returns 400 and lists the valid timeframes for tf=2m", async () => {
    const res = await request(app).get("/candles?symbol=MES&tf=2m");

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("1m, 5m, 15m, 1h");
  });

  it("returns 400 when tf is repeated", async () => {
    const res = await request(app).get("/candles?symbol=MES&tf=5m&tf=1h");

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("tf");
  });

  it("returns 404 and lists the available symbols for ES", async () => {
    const res = await request(app).get("/candles?symbol=ES&tf=5m");

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({ code: "SYMBOL_NOT_FOUND", message: 'Unknown symbol "ES". Available: MES, NQ' });
  });

  it("suggests the uppercase symbol for mes", async () => {
    const res = await request(app).get("/candles?symbol=mes&tf=5m");

    expect(res.status).toBe(404);
    expect(res.body.error.message).toContain('Did you mean "MES"?');
  });
});

describe("unknown routes", () => {
  it("returns 404 as JSON", async () => {
    const res = await request(app).get("/nope");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
  });
});
