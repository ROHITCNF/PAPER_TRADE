# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Standalone Node.js algo trading engine using **Fyers SDK** for live NSE market data. Scans ~200 equity symbols in parallel, applies the `openingMomentum` strategy, and manages exits via trailing stop-loss and time-based rules. No database — all state is in-memory. Order logs are written to `../logs/YYYY-MM-DD-orders.log`.

## Commands

```bash
npm run dev      # nodemon (auto-reload on file save)
npm start        # node index.js (production)
```

## Daily Setup (Required Before Each Trading Day)

Fyers tokens expire end-of-day. Before running:

1. Copy `.env.local.example` → `.env.local`
2. Update `ACCESS_TOKEN` and `AUTH_TOKEN` with fresh Fyers JWTs

`utils/constant.js` will throw at startup if either token is missing.

## Architecture

### Bootstrap (`index.js`)

1. `preloadAllSymbols(symbols)` — fetches 1 year of daily candles per symbol (300ms throttle), computes `context` (ADR, avgDailyVolume, prevDay OHLCV)
2. Creates one full pipeline per symbol: `eventBus → marketState → indicators → strategies → riskEngine`
3. Shared `paperBroker` and `riskEngine` across all symbols
4. Fyers WebSocket routes `sf` (tick) → `engine.emit("tick")` and `dp` (depth) → `engine.emit("depth")`

### Event Flow (`engine/engine.js`)

`wireEngine(eventBus, state, indicators, strategies, riskEngine)` connects everything for one symbol:

| Event | Source | Effect |
|-------|--------|--------|
| `tick` | Fyers `sf` feed | Updates state (ltp, vwap, dayStats), calls all strategies, calls riskEngine |
| `depth` | Fyers `dp` feed | Updates state (depth, spread), updates OBI + LiquidityVacuum |
| `entry` | Strategy | Sets `state.positions[strategyId] = true`, calls `riskEngine.registerPosition()` |
| `exit` | RiskEngine | Deletes `state.positions[strategyId]`, logs exit |

### Adding a New Strategy

1. Create `strategies/yourStrategy.js` exporting `createYourStrategy(broker, eventBus)`
2. Strategy must implement `{ id: string, onTick(state, signals), broker }`
3. Add to the `strategies` array in `index.js` — no other files need changing

`signals` passed to `onTick`: `{ vwap, obi, liquidityVacuum }`.

### Key Modules

- **`state/marketState.js`** — plain mutable object per symbol; `positions` is keyed by `strategyId` (supports multiple strategies on the same symbol)
- **`indicators/vwap.js`** — session-cumulative VWAP; call `reset()` at session start; has both `updateFromTick()` and `updateFromCandle()` paths
- **`indicators/obi.js`** — Order Book Imbalance, smoothed over last 10 depth events; range `[-1, +1]`
- **`signals/liquidityVacuum.js`** — detects thin book + wide spread; currently used as an entry gate in strategy (not an exit signal)
- **`risk/riskEngine.js`** — position key is `${strategyId}:${symbol}`; trailing stop tracks `highest`/`lowest` per position; time exit at 14:30 IST
- **`preload/historicalPreload.js`** — returns `{ [symbol]: { adrPercent, avgDailyVolume, prevDay } }` using 20-day averages
- **`utils/helper.js`** — `normalizeDepth(raw)` converts Fyers raw depth format to `{ bids, asks, bestBid, bestAsk, spread, timestamp }`; returns `null` if either side is empty

### `openingMomentum` Strategy Entry Filter Chain

Filters applied in order (all must pass):
1. Time gate: 09:30–14:30 IST
2. No existing position for this strategy on this symbol
3. Context loaded (preload completed)
4. No liquidity vacuum detected
5. Gap ≤ 1.2× ADR (`|chp| / 100 <= adrPercent * 1.2`)
6. Range used ≤ 80% of normal daily range
7. ADR ≥ 1.2% (skips illiquid stocks)
8. RVOL: before noon always passes; after noon requires `dayVolume >= avgDailyVolume * 0.6`
9. Price within 10% of ADR band from prev-day high or low
10. Trigger: `ltp > open && ltp > vwap && obi > 0.5`
