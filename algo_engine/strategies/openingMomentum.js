const fs   = require('fs');
const path = require('path');

const BREAKOUT_TICKS     = 3;    // consecutive ticks above/below level to confirm breakout
const OBI_THRESHOLD      = 0.65; // tightened from 0.5
const TICK_VOL_WINDOW    = 20;   // rolling window size for avg tick volume
const VOLUME_SPIKE_MULT  = 1.5;  // entry tick must be ≥ 1.5× the rolling avg

// Opening Momentum Strategy
// LONG : breakout above prev-day high — price strong, bid pressure, volume spike
// SHORT: breakdown below prev-day low  — price weak,  ask pressure, volume spike
function createOpeningMomentum(broker, eventBus) {
    const id = 'openingMomentum';

    // Breakout confirmation counters (reset to 0 the moment price pulls back)
    let ticksAbovePrevHigh = 0;
    let ticksBelowPrevLow  = 0;

    // Rolling tick-volume window
    const tickVols = [];

    function onTick(state, signals) {
        // 1. Time gate: 09:30 – 14:30
        if (!_isWithinEntryTime(state.time)) return;

        // 2. No existing position for this strategy
        if (state.positions[id]) return;

        // 3. Context must be loaded
        if (!state.context) return;

        // 4. Skip entry during liquidity vacuum (thin book = bad fills)
        if (signals.liquidityVacuum) return;

        // 5. Gap filter: skip if stock already gapped > 1.2× its ADR
        if (!_isGapAcceptable(state)) return;

        // 6. Range filter: skip if > 80% of normal daily range already consumed
        if (!_isRangeAvailable(state)) return;

        // 7. ADR filter: skip low-volatility/illiquid stocks (< 1.2% ADR)
        if (!_isTradable(state.context)) return;

        // 8. RVOL filter: after 12 PM, require at least 60% of avg daily volume
        if (!_hasSufficientVolume(state)) return;

        // Update per-tick trackers after common gates
        _updateBreakoutCounters(state);
        _updateTickVolume(state.volume);

        const hasVolumeSpike = _hasVolumeSpike(state.volume);
        const { open } = state.dayStats;

        // ── LONG: breakout above prev-day high ───────────────────────────────
        if (
            _isNearPrevDayHigh(state)          &&   // 9. near key level
            ticksAbovePrevHigh >= BREAKOUT_TICKS &&  // 1. held above for N ticks
            hasVolumeSpike                       &&  // 2. volume surge on this tick
            state.ltp   > open                   &&  // 10. above today's open
            state.ltp   > signals.vwap           &&  //     above VWAP
            signals.obi > OBI_THRESHOLD              // 3. strong bid pressure
        ) {
            _enterTrade(state, signals, 'LONG');
            return;
        }

        // ── SHORT: breakdown below prev-day low ──────────────────────────────
        if (
            _isNearPrevDayLow(state)            &&   // 9. near key level
            ticksBelowPrevLow >= BREAKOUT_TICKS  &&  // 1. held below for N ticks
            hasVolumeSpike                       &&  // 2. volume surge on this tick
            state.ltp    < open                  &&  // 10. below today's open
            state.ltp    < signals.vwap          &&  //     below VWAP
            signals.obi  < -OBI_THRESHOLD            // 3. strong ask pressure
        ) {
            _enterTrade(state, signals, 'SHORT');
        }
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

    function _isWithinEntryTime(epochSeconds) {
        const d = new Date(epochSeconds * 1000);
        const minutes = d.getHours() * 60 + d.getMinutes();
        return minutes >= (9 * 60 + 30) && minutes <= (14 * 60 + 30);
    }

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
            time:       Date.now(),
            symbol:     state.symbol,
            strategyId: id,
            side,
            ltp:        state.ltp,
            vwap:       signals.vwap,
            obi:        signals.obi,
            type:       'BUY'
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
