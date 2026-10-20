import express from "express";
import { createCandlesController } from "./controllers/candles.controller";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import type { createCandleService } from "./services/candle.service";

export function createApp(service: ReturnType<typeof createCandleService>) {
  const app = express();
  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.get("/candles", createCandlesController(service));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
