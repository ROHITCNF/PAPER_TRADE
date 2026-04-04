const fs = require('fs');
const path = require('path');

// Opening Momentum Strategy
// Entry: price above open + VWAP, strong bid pressure (OBI > 0.5),
//        near prev-day high/low, sufficient ADR and volume, no liquidity vacuum.
function createOpeningMomentum(broker, eventBus) {
    const id = 'openingMomentum';

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

        // 9. Location filter: price within 10% of ADR band from prev-day high or low
        if (!_isNearPrevDayLevel(state)) return;

        // 10. Final trigger: above open, above VWAP, bid pressure dominant
        if (
            state.ltp > state.dayStats.open &&
            state.ltp > signals.vwap &&
            signals.obi > 0.5
        ) {
            const qty = 1;

            broker.buy(state.symbol, state.ltp, qty);

            const logEntry = JSON.stringify({
                time: Date.now(),
                symbol: state.symbol,
                strategyId: id,
                ltp: state.ltp,
                vwap: signals.vwap,
                obi: signals.obi,
                type: 'BUY'
            });
            console.log(logEntry);
            _writeOrderLog(logEntry);

            eventBus.emit('entry', {
                strategyId: id,
                symbol: state.symbol,
                side: 'LONG',
                entryPrice: state.ltp,
                qty,
                context: state.context,
                entryTime: state.time
            });
        }
    }

    // ── Filters ─────────────────────────────────────────────────────────────

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

    function _isNearPrevDayLevel(state) {
        const { prevDay, adrPercent } = state.context;
        if (!prevDay) return false;
        const buffer = state.ltp * (adrPercent * 0.1);
        return (
            Math.abs(state.ltp - prevDay.high) <= buffer ||
            Math.abs(state.ltp - prevDay.low)  <= buffer
        );
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
