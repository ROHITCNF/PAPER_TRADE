const fs = require('fs');
const path = require('path');

function createRiskEngine({ adrMultiplier = 0.3, exitTime = "14:30" }) {
    const positions = {}; // symbol -> position state

    function registerPosition({ symbol, side, entryPrice, qty, context, entryTime }) {
        const adrPercent = context?.adrPercent;
        if (!adrPercent) return;

        const slPercent = adrPercent * adrMultiplier;

        const stopLoss =
            side === "LONG"
                ? entryPrice * (1 - slPercent)
                : entryPrice * (1 + slPercent);

        positions[symbol] = {
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
        const pos = positions[symbol];
        if (!pos) return;

        // --- Track favorable move ---
        if (pos.side === "LONG") {
            pos.highest = Math.max(pos.highest, ltp);
            const trail = pos.highest * (1 - (pos.stopLoss / pos.entryPrice - 1));
            pos.trailingStop = Math.max(pos.trailingStop, trail);

            if (ltp <= pos.trailingStop) {
                broker.sell(symbol, qty);

                eventBus.emit("exit", {
                    symbol,
                    reason: "SL" // or "TRAIL" or "TIME"
                });
                const date = new Date();
                const time = date.getTime();
                console.log(JSON.stringify({
                    time,
                    ltp: ltp,
                    symbol: symbol,
                    type: 'SELL'
                }));

                try {

                    const dateStr = date.toISOString().split('T')[0];
                    const fileName = `${dateStr}-orders.log`;

                    const filePath = path.join(__dirname, '../../../', fileName);

                    const logContent = JSON.stringify({
                        time,
                        ltp: ltp,
                        symbol: symbol,
                        type: 'SELL'
                    }) + '\n';

                    fs.appendFile(filePath, logContent, err => {
                        if (err) console.error("Failed to write to order log:", err);
                    });

                } catch (err) {
                    console.error("Failed to write to order log:", err);
                }
                delete positions[symbol];

            }
        }

        if (pos.side === "SHORT") {
            pos.lowest = Math.min(pos.lowest, ltp);
            const trail = pos.lowest * (1 + (pos.entryPrice / pos.stopLoss - 1));
            pos.trailingStop = Math.min(pos.trailingStop, trail);

            if (ltp >= pos.trailingStop) {
                broker.sell(symbol, qty);

                eventBus.emit("exit", {
                    symbol,
                    reason: "SL" // or "TRAIL" or "TIME"
                });

                delete positions[symbol];

            }
        }

        // --- Time-based exit ---
        if (isAfterExitTime(time, exitTime)) {
            pos.side === "LONG"
                ? broker.sell(symbol, pos.qty)
                : broker.buy(symbol, pos.qty);
            eventBus.emit("exit", {
                symbol,
                reason: "Time based Exit" // or "TRAIL" or "TIME"
            });
            delete positions[symbol];
        }
    }

    function isAfterExitTime(epochTime, exitTime) {
        const date = new Date(epochTime * 1000);
        const [hh, mm] = exitTime.split(":").map(Number);
        return date.getHours() > hh || (date.getHours() === hh && date.getMinutes() >= mm);
    }

    return {
        registerPosition,
        onTick
    };
}

module.exports = { createRiskEngine };
