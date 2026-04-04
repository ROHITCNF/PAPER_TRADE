# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered paper trading platform using **Fyers SDK** for real market data (NSE/BSE). Two operational modes controlled by `isFullStack` flag in `server/src/index.js`:

- **Algo mode** (`isFullStack = false`): Runs the live algo engine with Fyers WebSocket, no DB required.
- **Full-stack mode** (`isFullStack = true`): Enables REST API routes + MongoDB auth/profile/market-data endpoints.

## Commands

### Server

```bash
cd server
npm run dev      # nodemon (auto-reload)
npm start        # node src/index.js
```

### Client

```bash
cd client
npm run dev      # Next.js dev server (port 3000)
```

---

## Algo Engine Deep Dive (`server/src/algo_engine/`)

This is the core of the project. The engine is **per-symbol** and **event-driven**. `start_algo.js` creates one full pipeline instance per symbol at startup.

### Bootstrap Flow (`start_algo.js`)

1. `preloadAllSymbols(symbols)` — fetches 1 year of daily candles for each symbol (300ms throttle between symbols to avoid Fyers rate limits). Computes `context` per symbol.
2. For each symbol: instantiate `eventBus`, `marketState`, `vwap`, `obi`, `vacuum`, `paperBroker`, `strategy`, `riskEngine` → wire them together with `wireEngine(...)`.
3. Connect Fyers WebSocket. Route `sf` (tick) messages → `engine.emit("tick", ...)` and `dp` (depth) messages → `engine.emit("depth", ...)`.

### EventBus (`engine/eventBus.js`)

Minimal pub/sub. Supported events (by convention):
| Event | Emitted by | Handled by |
|-------|-----------|------------|
| `tick` | `start_algo` (Fyers `sf` feed) | `engine.js` → updates state, indicators, calls strategy + riskEngine |
| `depth` | `start_algo` (Fyers `dp` feed) | `engine.js` → updates OBI, LiquidityVacuum |
| `entry` | strategy (`openingMomentum`) | `engine.js` → sets `state.hasPosition = true`, calls `riskEngine.registerPosition()` |
| `exit` | `riskEngine` | `engine.js` → sets `state.hasPosition = false`, logs exit |

### MarketState (`state/marketState.js`)

Plain mutable object, one per symbol. Fields:

- `symbol`, `ltp`, `volume`, `time`, `dayVolume`
- `vwap`, `obi` — updated after each tick/depth event
- `depth`, `spread` — updated on each depth event
- `hasPosition` — flipped by `entry`/`exit` events
- `dayStats`: `{ open, high, low, prevClose, chp, upperCkt, lowerCkt }` — filled from Fyers tick `sf` data
- `context`: `{ prevDay, adrPercent, avgDailyVolume }` — filled at startup by `historicalPreload`

### Indicators

**VWAP** (`indicators/vwap.js`) — session-cumulative. Two update paths:

- `updateFromTick(price, qty)` — used in live engine
- `updateFromCandle(candle)` — available for backtesting use
- `reset()` — call at start of new session

**OBI** (`indicators/obi.js`) — Order Book Imbalance. Smoothed over last 10 depth updates.

- Formula: `(bidSum - askSum) / (bidSum + askSum)` across top 10 levels
- Range: `-1` (full ask pressure) to `+1` (full bid pressure)
- Strategy uses threshold: `obi > 0.5` as a buy signal

### Signal

**LiquidityVacuum** (`signals/liquidityVacuum.js`) — detects thin book + wide spread (potential rapid move).

- `detect()` returns `true` when `currDepth / avgDepth < 0.6 && currSpread / avgSpread > 1.2` over a 10-event window
- Currently updated on every depth event but **not used** in the strategy's entry/exit decision — available for future use

### Execution

**PaperBroker** (`execution/paperBroker.js`) — in-memory only.

- `buy(symbol, price, qty)` — stores position
- `sell(symbol, price)` — removes position, logs PnL to console
- **Note**: the `capital = 100000` parameter is accepted but not enforced; no actual balance tracking is implemented

### Risk Engine (`risk/riskEngine.js`)

Manages exits. Instantiated with `{ adrMultiplier = 0.3, exitTime = "14:30" }`.

`registerPosition({symbol, side, entryPrice, qty, context, entryTime})`:

- Stop-loss = `entryPrice * (1 - adrPercent * 0.3)` for LONG
- Sets both `stopLoss` and `trailingStop` to the same initial value

`onTick({symbol, ltp, time, broker, eventBus})` — three exit triggers:

1. **Trailing stop (LONG)**: tracks `highest`; trail = `highest * (1 - slPercent)`; exits if `ltp <= trailingStop`
2. **Trailing stop (SHORT)**: tracks `lowest`; exits if `ltp >= trailingStop`
3. **Time exit**: exits any open position when `time >= 14:30`

On exit: calls `broker.sell()`, emits `"exit"` event, deletes position from internal map, writes to dated order log.

> **Known bug** (`risk/riskEngine.js:42`, `risk/riskEngine.js:89`): `broker.sell(symbol, qty)` references `qty` which is not in scope — should be `pos.qty`.

### Strategy (`strategies/openingMomentum.js`)

Entry filter chain (all must pass in order):

1. **Time gate**: `09:30 – 14:30` (epoch seconds, IST)
2. **No existing position**: `state.hasPosition === false`
3. **Context exists**: `state.context` is populated
4. **Gap filter**: `|chp| / 100 <= adrPercent * 1.2` — skips stocks that already gapped more than 1.2× their ADR
5. **Range used filter**: `(dayHigh - dayLow) / (adrPercent * prevClose) <= 0.8` — skips if >80% of daily range already consumed
6. **ADR filter**: `adrPercent >= 0.012` — skips illiquid/low-volatility stocks
7. **RVOL filter**: before 12:00pm always passes; after 12:00pm requires `dayVolume >= avgDailyVolume * 0.6`
8. **Location filter**: `ltp` must be within `ltp * (adrPercent * 0.1)` of prev day high or low
9. **Final trigger**: `ltp > open && ltp > vwap && obi > 0.5`

On entry: calls `broker.buy()`, emits `"entry"` event, appends to dated `*-orders.log` in `server/`.

### Historical Preload (`preload/historicalPreload.js`)

Fetches 1 year of daily candles per symbol. Computes:

- `adrPercent`: 20-day average of `(high - low) / close`
- `avgDailyVolume`: 20-day average volume
- `prevDay`: second-to-last candle (yesterday's OHLCV)

Results are stored as `context` in `MarketState` and used by strategy filters and risk engine.

### Utilities

**`utils/constant.js`**:

- `equityStocks`: ~200 NSE equity symbols to scan
- `access_token` / `auth_token`: **Fyers JWTs that expire daily** — must be updated each trading day
- `FYERS_APP_ID`: `VI5GXIR8UI-100`
- `redirect_url`: used for Fyers OAuth callback

**`utils/helper.js`** — `normalizeDepth(raw)`: converts Fyers raw depth format (`bid_price1..5`, `bid_size1..5`, `bid_order1..5`) into `{ bids, asks, bestBid, bestAsk, spread, timestamp }`. Returns `null` if either side is empty.

---

## REST API Layer (`server/src/`) — Full-stack mode only

Active when `isFullStack = true` in `server/src/index.js`.

Routes registered at `/`:

- `routes/auth.js` — Fyers OAuth login, token exchange
- `routes/signup.js` — user registration
- `routes/profile.js` — profile and transactions
- `routes/marketData.js` — `/marketData/marketStatus` (GET), `/merketData/quotes` (POST) ← typo in route name is intentional/existing

All market data routes instantiate a fresh `FyersAPI` per request and authenticate via the `Authorization` header (JSON string containing `web_token` + `access_token`).

**AI Service** (`service/lib/genAi.js`) — Google Gemini (`@google/genai`) for trade analysis feedback.

---

## Client (`client/`)

Next.js 15 app with Tailwind CSS v4.

Routes:

- `/` → redirects to `/home`
- `/home` — dashboard: QuickView (6 major indices), MarketStatus, Order Entry placeholder
- `/login`, `/signup` — auth pages
- `/profile` — user profile
- `/strategy` — strategy tester UI

`utils/constant.js` — toggle `baseUrl` between `localhost:5001` and production render URL.

`middleware.js` — client-side route guard.

---

## Key Configuration

**`server/src/index.js`**: `isFullStack` boolean — the single switch between algo mode and full-stack API mode. CORS origin is hardcoded to a local network IP; the Vercel production URL is commented out.

**`server/src/algo_engine/utils/constant.js`**: Update `access_token` and `auth_token` every morning before running the algo — Fyers tokens expire at end of day.

**`server/.env`**: MongoDB URI, JWT secret, Google AI API key.

## Order Logs

BUY and SELL events are appended to `server/YYYY-MM-DD-orders.log` (one file per day). General tick/connection logs go to `server/YYYY-MM-DD.log`.
