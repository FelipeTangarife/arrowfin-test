# DECISIONS

### 1. Express over NestJS
I used Express with a simple layered structure (controllers, services, repositories). I rejected NestJS because for a single endpoint its modules, decorators and dependency injection add more code to read than they solve.

### 2. Clean the data once at startup, not on every request
The repository validates, deduplicates and sorts the rows once when the server starts, so every request works with clean data. I rejected cleaning inside each call, because it repeats the same work and every new consumer would have to do it againg. Cleaning doesn't fill missing minutes: those candles are built only from the minutes that exist, because filling them would invent prices for moments when nothing traded.

### 3. Candles start on the clock
Each candle starts at a round time: 5-minute candles at :00, :05, :10, and hourly candles on the hour. I considered starting them when the session opens (13:30), but the opening time isn't in the data, so I would have had to hardcode it for each contract. The downside is that the first hourly candle only has 30 minutes of trading.



# PROMPTS

Note: I wrote first my prompts in Spanish, in my own words, and used ChatGPT to turn them into structured English specs before passing them to Claude.


# Prebuild #0 Look at the data before writing code

## Goal
Understand the dataset well enough to know what can go wrong before building anything.

## Problem and why
The dataset README says the file is unsorted, has repeated rows and has missing minutes, but I want to see it for myself and find anything else it doesn't mention.
If I build on wrong assumptions about the data, the numbers will be wrong even if the code works.

## Scope
- `backend/dataset/candles_1m.json`, `instruments.json` and `README.md`.
- A throwaway script to inspect the data, kept out of `src/`. Don't touch the project code.

## Constraints
- Check what the README claims and tell me if anything is different.
- Look for:
  - how many rows there are per symbol, and the first and last time for each
  - whether every row has the same fields and types
  - repeated rows: which ones, and whether the copies are identical or have different values
  - missing minutes inside the session, per symbol
  - candles that don't make sense: low above high, open or close outside the range, negative or zero volume
  - prices that don't match the tick size in `instruments.json`
  - timestamps that aren't on an exact minute or are outside the session
  - any 5m, 15m or 1h candle that would end up empty or incomplete
- Give me two or three reference candles I can calculate by hand and use in tests, including one affected by the duplicates (with and without counting them).
- Only report what you actually found running the script. No guesses.

## Tasks
- [ ] `T0.1` Short report: what the README got right, what else you found, and the reference values.


# Feature #1 - Load the dataset

## Goal
Read the dataset once when the server starts, clean it and keep it in memory, grouped by symbol and sorted by time.

## Problem and why
The file comes unsorted and has repeated rows. If I clean it once when loading, the rest of the code doesn't have to worry about it.

## Scope
- Types in `models/candle.ts`.
- `repositories/candle.repository.ts` with a pure `parseCandles` function (so I can test it without reading the file) and a separate function that reads the file and calls it.
- No aggregation or HTTP yet.

## Constraints
- Drop duplicates by symbol + timestamp. If two rows have the same key but different values, keep the first one and log a warning.
- Skip rows that don't make sense (non-numeric prices, low above high, negative volume) with a single warning at the end. Don't crash and don't let NaN through.
- If the file is missing or isn't a JSON array, throw a clear error.
- The path shouldn't depend on where I run the command from: use `DATASET_PATH` if it's set, otherwise resolve it relative to the file.

## Tasks
- [] `T1.1` Tests first: it sorts, it removes the duplicates, it keeps the first one when they conflict, it skips a broken row, and the real file ends up with 388 MES and 384 NQ candles.
- [] `T1.2` Implement until the tests pass.


# Feature #2 Aggregate candles

## Goal
Turn 1m candles into 5m, 15m or 1h: open of the first, close of the last, highest high, lowest low, summed volume.

## Problem and why
The dataset only has 1-minute candles, and small mistakes here (a duplicated or missing minute, a wrong bucket boundary) give wrong numbers that still look believable.
That's why it's a pure function, separate from HTTP and the file, so I can check it against known values.

## Scope
- `services/timeframes.ts` with the four timeframes and their length in ms, so adding a new one is a single line.
- `services/aggregate.ts`, a pure function.
- `services/candle.service.ts` with `getCandles(symbol, tf)`, which uses the repository and aggregate. If the symbol doesn't exist, it throws an error that says which symbols are available.
- No HTTP yet.

## Constraints
- Buckets are aligned to the UTC clock (floor of the timestamp by the timeframe). That means the first 1h candle is 13:00 and only has 30 minutes. That's fine, but leave a comment explaining it.
- If a bucket has no minutes, it simply doesn't appear. Don't fill gaps.
- 1m returns the data as is.
- Services shouldn't import Express or read files.

## Tasks
- [] `T2.1` Test: the 3-candle example from the assignment gives o 100, h 102, l 98, c 99, v 60.
- [] `T2.2` Test: MES 5m 14:00 matches the reference values.
- [] `T2.3` Test: MES 5m 14:10 has volume 9896 going through the real file, same as with the duplicates removed by hand.
- [] `T2.4` Test: NQ 5m 15:45 only uses the minutes that exist, and the total volume is the same in 1m and 5m.
- [] `T2.5` Test: asking for symbol ES fails with the not found error.
- [] `T2.6` Implement until the tests pass.


# Feature #3 GET /candles endpoint

## Goal
`GET /candles?symbol=MES&tf=5m` returns `{ symbol, tf, candles: [{ t, o, h, l, c, v }] }` with `t` as an ISO date.

## Problem and why
Right now the candles only exist inside the code. The frontend needs a way to ask for them over HTTP, and anything can come in a URL: a missing param, a typo, a timeframe we don't support, a lowercase symbol, the same param twice. Also asks that bad input never crashes the server or returns NaN.

## Scope
- `controllers/candles.controller.ts`: read the query, validate it, call the service, return the JSON. No calculations in there.
- `middleware/error-handler.ts`: turns errors into JSON.
- `app.ts` builds the app without listening on a port, so the tests can use it without starting a real server. Add a `/health` route there.
- `server.ts` loads the data, creates the app and starts listening. If the data fails to load, it exits with a clear message.

## Constraints
- Errors always look like `{ error: { code, message } }` and never show a stack trace.
- 400 if symbol or tf is missing, comes twice, or tf isn't one of the four (say which ones are valid).
- 404 if the symbol doesn't exist (say which ones do). Lowercase "mes" counts as not found, but suggest MES.
- 404 in JSON for routes that don't exist.
- 500 with a generic message for anything unexpected, logged on the server.

## Tasks
- [] `T3.1` Tests with supertest: the happy path for MES 5m (sorted, first candle 13:30), missing tf, tf=2m, tf repeated, symbol ES, unknown route.
- [] `T3.2` Implement until they pass, then try it by hand with curl.


# Feature #4 Frontend data

## Goal
The page can ask the backend for candles and knows if it's loading, failed or got data.

## Problem and why
The page shows a chart of what the backend returns, and the user can switch symbol and timeframe at any moment.
If an older request finishes after a newer one, the chart would show data for a selection that's no longer active.

## Scope
- Calls go through `/api`, which Next forwards to the backend.
- One constants file with the symbols and timeframes.
- A `fetchCandles` function and a `useCandles` hook.
- No UI yet.

## Constraints
- Cancel the previous request when the selection changes.
- Show the backend's error message, and something readable if the backend is down.

## Tasks
- [] `T4.1` `fetchCandles` and `useCandles`.


# Feature #5 Candles page

## Goal
One screen where I pick a symbol and a timeframe and see the candles as a chart.

## Problem and why
This is where everything comes together, and it's what someone sees first when they run the project.
Waiting for data or a backend error shouldn't leave a blank or broken screen.

## Scope
- A `CandleChart` component with lightweight-charts (version 5, `addSeries` with `CandlestickSeries`).
- A `CandlesView` component with the dropdowns and the states.
- `page.tsx` just renders the view.
- Default styling.

## Constraints
- Create the chart once and only update its data when the selection changes. Remove it when the component goes away, and make sure doesn't end up with two charts.
- The chart expects timestamps in seconds.
- While loading, keep the previous chart and show "Loading...". On error, show the backend's message and a retry button. With no data, show "No data".
- Dropdowns with labels.
- Only the components that need it run on the client.

## Tasks
- [] `T5.1` Chart component.
- [] `T5.2` View with dropdowns and states. Check it with the backend stopped and with both symbols at 1h.