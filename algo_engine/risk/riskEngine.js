const fs = require('fs');
const path = require('path');

// adrMultiplier: stop-loss = entryPrice * (1 - adrPercent * adrMultiplier)
// exitTime: force-close all positions at this time (HH:MM, IST)
function createRiskEngine({ adrMultiplier = 0.3, exitTime = '14:30' } = {}) {
    const positions = {}; // key: `${strategyId}:${symbol}`

    function registerPosition({ strategyId, symbol, side, entryPrice, qty, context, entryTime }) {
        const adrPercent = context?.adrPercent;
        if (!adrPercent) return;

        const slPercent = adrPercent * adrMultiplier;

        const stopLoss =
            side === 'LONG'
                ? entryPrice * (1 - slPercent)
                : entryPrice * (1 + slPercent);

        const key = `${strategyId}:${symbol}`;
        positions[key] = {
            key,
            strategyId,
            symbol,
            side,
            entryPrice,
            qty,
            stopLoss,
            trailingStop: stopLoss,
            highest: entryPrice,
            lowest: entryPrice,
            entryTime
        };
    }

    function onTick({ symbol, ltp, time, broker, eventBus }) {
        for (const key of Object.keys(positions)) {
            const pos = positions[key];
            if (pos.symbol !== symbol) continue;

            // --- Trailing stop ---
            if (pos.side === 'LONG') {
                pos.highest = Math.max(pos.highest, ltp);
                const slPercent = 1 - (pos.stopLoss / pos.entryPrice);
                const trail = pos.highest * (1 - slPercent);
                pos.trailingStop = Math.max(pos.trailingStop, trail);

                if (ltp <= pos.trailingStop) {
                    _exit(pos, ltp, 'TRAIL_SL', broker, eventBus);
                    continue;
                }
            }

            if (pos.side === 'SHORT') {
                pos.lowest = Math.min(pos.lowest, ltp);
                const slPercent = (pos.stopLoss / pos.entryPrice) - 1;
                const trail = pos.lowest * (1 + slPercent);
                pos.trailingStop = Math.min(pos.trailingStop, trail);

                if (ltp >= pos.trailingStop) {
                    _exit(pos, ltp, 'TRAIL_SL', broker, eventBus);
                    continue;
                }
            }

            // --- Time-based exit ---
            if (_isAfterExitTime(time, exitTime)) {
                _exit(pos, ltp, 'TIME', broker, eventBus);
            }
        }
    }

    function _exit(pos, ltp, reason, broker, eventBus) {
        broker.sell(pos.symbol, ltp);

        eventBus.emit('exit', {
            strategyId: pos.strategyId,
            symbol: pos.symbol,
            reason
        });

        const logEntry = JSON.stringify({
            time: Date.now(),
            symbol: pos.symbol,
            strategyId: pos.strategyId,
            side: pos.side,
            ltp,
            reason,
            type: pos.side === 'SHORT' ? 'COVER' : 'SELL'
        });
        console.log(logEntry);
        _writeOrderLog(logEntry);

        delete positions[pos.key];
    }

    function _isAfterExitTime(epochSeconds, exitTime) {
        const date = new Date(epochSeconds * 1000);
        const [hh, mm] = exitTime.split(':').map(Number);
        return date.getHours() > hh || (date.getHours() === hh && date.getMinutes() >= mm);
    }

    function _writeOrderLog(line) {
        const dateStr = new Date().toISOString().split('T')[0];
        const filePath = path.join(__dirname, '../../logs', `${dateStr}-orders.log`);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.appendFile(filePath, line + '\n', err => {
            if (err) console.error('Failed to write order log:', err);
        });
    }

    return { registerPosition, onTick };
}

module.exports = { createRiskEngine };
