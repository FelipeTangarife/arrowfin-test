import type { Request, RequestHandler } from "express";
import { HttpError } from "../middleware/error-handler";
import type { createCandleService } from "../services/candle.service";
import { TIMEFRAMES, isTimeframe } from "../services/timeframes";

type CandleService = ReturnType<typeof createCandleService>;

function singleParam(req: Request, name: string): string {
  const value = req.query[name];
  if (value === undefined || value === "") throw new HttpError(400, "INVALID_PARAM", `Query param "${name}" is required`);
  if (typeof value !== "string") throw new HttpError(400, "INVALID_PARAM", `Query param "${name}" must be given once`);
  return value;
}

export function createCandlesController(service: CandleService): RequestHandler {
  return (req, res) => {
    const symbol = singleParam(req, "symbol");
    const tf = singleParam(req, "tf");
    if (!isTimeframe(tf)) {
      const valid = Object.keys(TIMEFRAMES).join(", ");
      throw new HttpError(400, "INVALID_PARAM", `Unsupported tf "${tf}". Valid: ${valid}`);
    }

    const candles = service.getCandles(symbol, tf).map((c) => ({
      t: c.ts,
      o: c.open,
      h: c.high,
      l: c.low,
      c: c.close,
      v: c.volume,
    }));
    res.json({ symbol, tf, candles });
  };
}
