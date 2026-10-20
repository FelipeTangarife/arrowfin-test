"use client";

import { useState } from "react";
import { CandleChart } from "@/components/CandleChart";
import { useCandles } from "@/hooks/useCandles";
import { INSTRUMENTS, SYMBOLS, TIMEFRAMES, type Ticker, type Timeframe } from "@/lib/constants";
import styles from "./CandlesView.module.css";

const price = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function CandlesView() {
  const [symbol, setSymbol] = useState<Ticker>("MES");
  const [tf, setTf] = useState<Timeframe>("5m");
  const state = useCandles(symbol, tf);

  const candles = state.status === "success" ? state.candles : state.status === "loading" ? state.previous : [];
  const first = candles[0];
  const last = candles.at(-1);
  const change = first && last ? last.c - first.o : 0;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.symbol}>{symbol}</h1>
          <p className={styles.muted}>{INSTRUMENTS[symbol]}</p>
        </div>
        {first && last && (
          <div className={styles.quote}>
            <span className={styles.price}>{price.format(last.c)}</span>
            <span className={change >= 0 ? styles.up : styles.down}>
              {change >= 0 ? "+" : "−"}
              {price.format(Math.abs(change))} ({((Math.abs(change) / first.o) * 100).toFixed(2)}%)
            </span>
          </div>
        )}
      </header>

      <div className={styles.controls}>
        <label className={styles.field}>
          <span className={styles.legend}>Contract</span>
          <select className={styles.select} value={symbol} onChange={(e) => setSymbol(e.target.value as Ticker)}>
            {SYMBOLS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <Segmented legend="Timeframe" options={TIMEFRAMES} value={tf} onChange={setTf} />
      </div>

      <section className={styles.panel}>
        <CandleChart candles={candles} />
        <div role="status" className={styles.status}>
          {state.status === "loading" && <span className={styles.badge}>Loading…</span>}
          {state.status === "error" && (
            <div className={styles.error}>
              <p>{state.message}</p>
              <button type="button" className={styles.retry} onClick={state.retry}>
                Retry
              </button>
            </div>
          )}
          {state.status === "success" && candles.length === 0 && (
            <span className={styles.badge}>No candles for this selection.</span>
          )}
        </div>
      </section>

      <p className={styles.muted}>Times are in UTC.</p>
    </main>
  );
}

interface SegmentedProps<T extends string> {
  legend: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

function Segmented<T extends string>({ legend, options, value, onChange }: SegmentedProps<T>) {
  return (
    <fieldset className={styles.segmented}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option} className={styles.option}>
            <input
              type="radio"
              name={legend}
              value={option}
              checked={option === value}
              onChange={() => onChange(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
