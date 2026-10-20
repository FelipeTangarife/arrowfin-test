"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/api";

export function CandleChart({ candles }: { candles: Candle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<{ chart: IChartApi; series: ISeriesApi<"Candlestick"> } | null>(null);

  useEffect(() => {
    const container = containerRef.current!;
    const css = getComputedStyle(container);
    const token = (name: string) => css.getPropertyValue(name).trim();

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: token("--surface") },
        textColor: token("--muted"),
        fontFamily: css.fontFamily,
      },
      grid: { vertLines: { color: token("--grid") }, horzLines: { color: token("--grid") } },
      rightPriceScale: { borderColor: token("--line") },
      timeScale: { timeVisible: true, borderColor: token("--line") },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: token("--up"),
      downColor: token("--down"),
      wickUpColor: token("--up"),
      wickDownColor: token("--down"),
      borderVisible: false,
    });
    chartRef.current = { chart, series };
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.series.setData(
      candles.map((c) => ({
        time: (Date.parse(c.t) / 1000) as UTCTimestamp,
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
      })),
    );
    chartRef.current.chart.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
