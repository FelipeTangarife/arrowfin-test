# Code review

```js
app.get('/candles/mes', (req, res) => {
  const rows = JSON.parse(fs.readFileSync('dataset/candles_1m.json', 'utf8'));
  res.json(rows.filter((r) => r.symbol === 'MES'));
});
app.get('/candles/nq', (req, res) => {
  const rows = JSON.parse(fs.readFileSync('dataset/candles_1m.json', 'utf8'));
  res.json(rows.filter((r) => r.symbol === 'MES'));
});
```

## Status: REQUEST CHANGES


## Must fix before merge

1. **`/candles/nq` returns MES data.** The filter in the second route still says `'MES'`. The NQ chart will just quietly show the wrong contract.

2. **The file is read and parsed on every request.** `readFileSync` + `JSON.parse` blocks each time someone asks for candles, and the data never changes while the server runs. Load it once at startup, keep it in memory, and have the handlers read from there.

3. **No error handling.** If the file is missing or the JSON is broken, every request ends up in Express's default 500 page.


## Would also change

- **One route instead of one per symbol.** `GET /candles?symbol=MES&tf=5m` with validation means adding a contract is data, not another copy of the handler.

