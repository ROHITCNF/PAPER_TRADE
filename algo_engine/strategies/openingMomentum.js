const fs   = require('fs');
const path = require('path');

const BREAKOUT_TICKS     = 3;    // consecutive ticks above/below level to confirm breakout
const OBI_THRESHOLD      = 0.65; // tightened from 0.5
const TICK_VOL_WINDOW    = 20;   // rolling window size for avg tick volume
const VOLUME_SPIKE_MULT  = 1.5;  // entry tick must be ≥ 1.5× the rolling avg

// Opening Momentum Strategy
// Phase 1 (09:15–09:30): capture opening range high/low
// Phase 2 (09:30–14:30): trade only if price breaks above/below that range
//
// LONG : ltp > opening range high + breakout above prev-day high
// SHORT: ltp < opening range low  + breakdown below prev-day low
function createOpeningMomentum(broker, eventBus) {
    const id = 'openingMomentum';

    // ── Opening range state (resets each day) ────────────────────────────────
    let openingRangeHigh = null;
    let openingRangeLow  = null;

    // ── Per-day trackers (reset each day) ────────────────────────────────────
    let ticksAbovePrevHigh = 0;
    let ticksBelowPrevLow  = 0;
    let tickVols           = [];
    let prevLtp            = null; // previous tick price — enforces momentum direction
    let lastDate           = null;

    function _resetDailyState() {
        openingRangeHigh   = null;
        openingRangeLow    = null;
        ticksAbovePrevHigh = 0;
        ticksBelowPrevLow  = 0;
        tickVols           = [];
        prevLtp            = null;
    }

    function _getTimeInfo(epochSeconds) {
        const d       = new Date(epochSeconds * 1000);
        const minutes = d.getHours() * 60 + d.getMinutes();
        const dateStr = d.toISOString().split('T')[0];
        return { minutes, dateStr };
    }

    function onTick(state, signals) {
        const { minutes, dateStr } = _getTimeInfo(state.time);

        // ── Reset all daily state on new trading day ─────────────────────────
        if (dateStr !== lastDate) {
            _resetDailyState();
            lastDate = dateStr;
        }

        // ── Phase 1: 09:15–09:30 — build opening range, no entries ──────────
        // In backtest: state.candle has full OHLCV → use candle.high/low for accurate range
        // In live:     state.candle is null → use ltp (real tick price)
        if (minutes >= (9 * 60 + 15) && minutes < (9 * 60 + 30)) {
            const rangeHigh = state.candle ? state.candle.high : state.ltp;
            const rangeLow  = state.candle ? state.candle.low  : state.ltp;
            openingRangeHigh = openingRangeHigh !== null ? Math.max(openingRangeHigh, rangeHigh) : rangeHigh;
            openingRangeLow  = openingRangeLow  !== null ? Math.min(openingRangeLow,  rangeLow)  : rangeLow;
            return; // no trading during this window
        }

        // ── Phase 2: 09:30–14:30 — entry logic ──────────────────────────────

        // 1. Time gate
        if (minutes < (9 * 60 + 30) || minutes > (14 * 60 + 30)) return;

        // 2. Opening range must be captured
        if (openingRangeHigh === null || openingRangeLow === null) return;

        // 3. No existing position for this strategy
        if (state.positions[id]) return;

        // 4. Context must be loaded
        if (!state.context) return;

        // 5. Skip entry during liquidity vacuum (thin book = bad fills)
        if (signals.liquidityVacuum) return;

        // 6. Gap filter: skip if stock already gapped > 1.2× its ADR
        if (!_isGapAcceptable(state)) return;

        // 7. Range filter: skip if > 80% of normal daily range already consumed
        if (!_isRangeAvailable(state)) return;

        // 8. ADR filter: skip low-volatility/illiquid stocks (< 1.2% ADR)
        if (!_isTradable(state.context)) return;

        // 9. RVOL filter: after 12 PM, require at least 60% of avg daily volume
        if (!_hasSufficientVolume(state)) return;

        // Update per-tick trackers after common gates
        _updateBreakoutCounters(state);
        _updateTickVolume(state.volume);

        const hasVolumeSpike = _hasVolumeSpike(state.volume);
        const tickingUp   = prevLtp !== null && state.ltp > prevLtp;
        const tickingDown = prevLtp !== null && state.ltp < prevLtp;

        // Track prevLtp AFTER computing direction but BEFORE returning
        const currentLtp = state.ltp;

        // ── LONG: price above opening range high + prev-day high breakout ────
        if (
            tickingUp                                            &&   // current price > last price
            state.ltp > openingRangeHigh                         &&   // above 09:15–09:30 high
            _isNearPrevDayHigh(state)                            &&   // near key level
            ticksAbovePrevHigh >= BREAKOUT_TICKS                 &&   // held above for N ticks
            hasVolumeSpike                                       &&   // volume surge on this tick
            state.ltp   > signals.vwap                           &&   // above VWAP
            (signals.obi === null || signals.obi > OBI_THRESHOLD)     // bid pressure (null = backtest, skip)
        ) {
            prevLtp = currentLtp;
            _enterTrade(state, signals, 'LONG');
            return;
        }

        // ── SHORT: price below opening range low + prev-day low breakdown ────
        if (
            tickingDown                                           &&   // current price < last price
            state.ltp < openingRangeLow                           &&   // below 09:15–09:30 low
            _isNearPrevDayLow(state)                              &&   // near key level
            ticksBelowPrevLow >= BREAKOUT_TICKS                   &&   // held below for N ticks
            hasVolumeSpike                                        &&   // volume surge on this tick
            state.ltp    < signals.vwap                           &&   // below VWAP
            (signals.obi === null || signals.obi < -OBI_THRESHOLD)     // ask pressure (null = backtest, skip)
        ) {
            prevLtp = currentLtp;
            _enterTrade(state, signals, 'SHORT');
            return;
        }

        prevLtp = currentLtp;
    }

    // ── Per-tick trackers ────────────────────────────────────────────────────

    function _updateBreakoutCounters(state) {
        const { prevDay } = state.context;
        if (!prevDay) return;
        ticksAbovePrevHigh = state.ltp > prevDay.high ? ticksAbovePrevHigh + 1 : 0;
        ticksBelowPrevLow  = state.ltp < prevDay.low  ? ticksBelowPrevLow  + 1 : 0;
    }

    function _updateTickVolume(vol) {
        if (vol <= 0) return;
        tickVols.push(vol);
        if (tickVols.length > TICK_VOL_WINDOW) tickVols.shift();
    }

    function _hasVolumeSpike(currentVol) {
        if (tickVols.length < TICK_VOL_WINDOW) return false;
        const avg = tickVols.reduce((a, b) => a + b, 0) / tickVols.length;
        return currentVol >= avg * VOLUME_SPIKE_MULT;
    }

    // ── Filters ──────────────────────────────────────────────────────────────

    function _isTradable({ adrPercent }) {
        return adrPercent >= 0.012;
    }

    function _isGapAcceptable(state) {
        const { chp } = state.dayStats;
        const { adrPercent } = state.context;
        if (chp == null || !adrPercent) return false;
        return (Math.abs(chp) / 100) <= adrPercent * 1.2;
    }

    function _isRangeAvailable(state) {
        const { high, low, prevClose } = state.dayStats;
        const { adrPercent } = state.context;
        if (!high || !low || !prevClose || !adrPercent) return false;
        const used = (high - low) / (adrPercent * prevClose);
        return used <= 0.8;
    }

    function _hasSufficientVolume(state) {
        const { avgDailyVolume } = state.context;
        if (!avgDailyVolume || !state.dayVolume) return false;
        const d = new Date(state.time * 1000);
        const minutes = d.getHours() * 60 + d.getMinutes();
        if (minutes < 12 * 60) return true; // before noon: skip volume check
        return state.dayVolume >= avgDailyVolume * 0.6;
    }

    function _isNearPrevDayHigh(state) {
        const { prevDay, adrPercent } = state.context;
        if (!prevDay) return false;
        const buffer = state.ltp * (adrPercent * 0.1);
        return Math.abs(state.ltp - prevDay.high) <= buffer;
    }

    function _isNearPrevDayLow(state) {
        const { prevDay, adrPercent } = state.context;
        if (!prevDay) return false;
        const buffer = state.ltp * (adrPercent * 0.1);
        return Math.abs(state.ltp - prevDay.low) <= buffer;
    }

    // ── Entry ─────────────────────────────────────────────────────────────────

    function _enterTrade(state, signals, side) {
        const qty = 1;

        if (side === 'LONG') {
            broker.buy(state.symbol, state.ltp, qty);
        } else {
            broker.short(state.symbol, state.ltp, qty);
        }

        const logEntry = JSON.stringify({
            time:              Date.now(),
            symbol:            state.symbol,
            strategyId:        id,
            side,
            ltp:               state.ltp,
            vwap:              signals.vwap,
            obi:               signals.obi,
            openingRangeHigh,
            openingRangeLow,
            type:              side === 'LONG' ? 'BUY' : 'SHORT'
        });
        console.log(logEntry);
        _writeOrderLog(logEntry);

        eventBus.emit('entry', {
            strategyId: id,
            symbol:     state.symbol,
            side,
            entryPrice: state.ltp,
            qty,
            context:    state.context,
            entryTime:  state.time
        });
    }

    function _writeOrderLog(line) {
        const dateStr = new Date().toISOString().split('T')[0];
        const filePath = path.join(__dirname, '../../logs', `${dateStr}-orders.log`);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.appendFile(filePath, line + '\n', err => {
            if (err) console.error('Failed to write order log:', err);
        });
    }

    return { id, onTick, broker };
}

module.exports = { createOpeningMomentum };
