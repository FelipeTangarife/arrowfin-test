# API

Base URL: `http://localhost:3001`. The frontend calls it through the Next rewrite at `/api` (for example `/api/candles?...`).

## GET /candles

Returns the candles of one contract aggregated to a timeframe, oldest first.

```
GET /candles?symbol=MES&tf=5m
```

| Query param | Required | Values |
| --- | --- | --- |
| `symbol` | yes | `MES`, `NQ` (case-sensitive) |
| `tf` | yes | `1m`, `5m`, `15m`, `1h` |

Each param must be sent once.

### 200 OK

```json
{
  "symbol": "MES",
  "tf": "5m",
  "candles": [
    { "t": "2026-08-25T13:30:00Z", "o": 5630, "h": 5635.25, "l": 5629.75, "c": 5635, "v": 13195 },
    { "t": "2026-08-25T13:35:00Z", "o": 5635, "h": 5640.25, "l": 5634.25, "c": 5639, "v": 12212 }
  ]
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `t` | string (ISO 8601, UTC) | Start of the bucket, aligned to the UTC clock |
| `o` | number | Open of the first minute in the bucket |
| `h` | number | Highest high |
| `l` | number | Lowest low |
| `c` | number | Close of the last minute in the bucket |
| `v` | number | Summed volume |

Buckets with no traded minutes are not returned. The first `1h` candle is `13:00` and only covers 13:30 to 13:59.

### Errors

Every error has the same shape and never includes a stack trace:

```json
{ "error": { "code": "INVALID_PARAM", "message": "Unsupported tf \"2m\". Valid: 1m, 5m, 15m, 1h" } }
```

| Status | `code` | When | Example `message` |
| --- | --- | --- | --- |
| 400 | `INVALID_PARAM` | `symbol` or `tf` missing | `Query param "tf" is required` |
| 400 | `INVALID_PARAM` | Param sent more than once | `Query param "tf" must be given once` |
| 400 | `INVALID_PARAM` | Unsupported `tf` | `Unsupported tf "2m". Valid: 1m, 5m, 15m, 1h` |
| 404 | `SYMBOL_NOT_FOUND` | Unknown symbol | `Unknown symbol "ES". Available: MES, NQ` |
| 404 | `SYMBOL_NOT_FOUND` | Wrong case | `Unknown symbol "mes". Did you mean "MES"? Available: MES, NQ` |
| 404 | `ROUTE_NOT_FOUND` | Route does not exist | `Route GET /nope not found` |
| 500 | `INTERNAL_ERROR` | Anything unexpected (logged on the server) | `Something went wrong` |

## GET /health

```json
{ "ok": true }
```
