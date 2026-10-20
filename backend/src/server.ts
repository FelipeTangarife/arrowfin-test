import { createApp } from "./app";
import type { CandlesBySymbol } from "./models/candle";
import { loadCandles } from "./repositories/candle.repository";
import { createCandleService } from "./services/candle.service";

const PORT = 3001;

let candles: CandlesBySymbol;
try {
  candles = loadCandles();
} catch (error) {
  console.error(`Failed to load candles: ${(error as Error).message}`);
  process.exit(1);
}

createApp(createCandleService(candles)).listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
