// Backtest broker — same buy/short/sell interface as paperBroker so it works
// transparently with the strategy and risk engine. Adds trade history recording.
//
// Call setCurrentTime(epochSeconds) before each tick so entry/exit times are
// captured from the candle timestamp rather than wall-clock time.
function createBacktestBroker() {
    const openPositions = {};
    const tradeHistory  = [];
    let   currentTime   = null;

    function setCurrentTime(epochSeconds) {
        currentTime = epochSeconds;
    }

    function buy(symbol, price, qty) {
        openPositions[symbol] = { symbol, side: 'LONG', entryPrice: price, qty, entryTime: currentTime };
        console.log(`  BUY   ${symbol} @ ${price}`);
    }

    function short(symbol, price, qty) {
        openPositions[symbol] = { symbol, side: 'SHORT', entryPrice: price, qty, entryTime: currentTime };
        console.log(`  SHORT ${symbol} @ ${price}`);
    }

    // reason is passed by riskEngine (TRAIL_SL / TIME) — ignored by paperBroker but recorded here
    function sell(symbol, price, reason) {
        const pos = openPositions[symbol];
        if (!pos) return;

        const pnl = pos.side === 'SHORT'
            ? (pos.entryPrice - price) * pos.qty
            : (price - pos.entryPrice) * pos.qty;

        tradeHistory.push({
            symbol,
            side:       pos.side,
            entryPrice: pos.entryPrice,
            exitPrice:  price,
            qty:        pos.qty,
            pnl:        parseFloat(pnl.toFixed(2)),
            entryTime:  pos.entryTime,
            exitTime:   currentTime,
            reason:     reason || '—'
        });

        delete openPositions[symbol];

        const tag = pos.side === 'SHORT' ? 'COVER' : 'SELL ';
        console.log(`  ${tag} ${symbol} @ ${price} | PnL: ${pnl.toFixed(2)} | reason: ${reason || '—'}`);
    }

    function getOpenPositions() { return { ...openPositions }; }
    function getTradeHistory()  { return [...tradeHistory]; }

    return { buy, short, sell, setCurrentTime, getOpenPositions, getTradeHistory };
}

module.exports = { createBacktestBroker };
