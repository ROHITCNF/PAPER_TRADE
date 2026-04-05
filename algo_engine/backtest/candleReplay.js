// Groups a flat candle array into { 'YYYY-MM-DD': [candles] }
function _groupByDay(candles) {
    const days = {};
    for (const c of candles) {
        const date = new Date(c.timestamp * 1000).toISOString().split('T')[0];
        if (!days[date]) days[date] = [];
        days[date].push(c);
    }
    return days;
}

// Replays all intraday candles for one symbol.
// Each 1-min candle = 1 tick event.
//
//   price  = candle.open   (the price you'd actually see at the start of the minute)
//   candle = { open, high, low, close, volume }  (passed through for:
//             - strategy: opening range uses candle.high/low during 9:15–9:30
//             - riskEngine: checks candle.low/high against trailing stop)
//   qty    = candle.volume (full candle volume)
//
// VWAP is updated via wireEngine's updateFromTick(open, volume). For more accurate
// VWAP in backtest, wireEngine checks for t.candle and uses updateFromCandle instead.
function replayCandles(symbol, candles, context, eventBus, broker) {
    const dayGroups = _groupByDay(candles);

    for (const [, dayCandles] of Object.entries(dayGroups).sort()) {
        if (dayCandles.length === 0) continue;

        const sessionOpen = dayCandles[0].open;
        const prevClose   = context.prevDay?.close ?? null;
        let sessionHigh   = -Infinity;
        let sessionLow    =  Infinity;
        let cumVolume     = 0;

        for (const candle of dayCandles) {
            sessionHigh = Math.max(sessionHigh, candle.high);
            sessionLow  = Math.min(sessionLow,  candle.low);
            cumVolume  += candle.volume;

            broker.setCurrentTime(candle.timestamp);

            eventBus.emit('tick', {
                price:  candle.open,           // evaluate at open price
                qty:    candle.volume,
                time:   candle.timestamp,
                volume: cumVolume,
                candle,                        // full OHLCV for strategy + riskEngine
                dayStats: {
                    open:      sessionOpen,
                    high:      sessionHigh,
                    low:       sessionLow,
                    prevClose,
                    chp: prevClose
                        ? ((sessionOpen - prevClose) / prevClose) * 100
                        : null,
                    upperCkt: null,
                    lowerCkt: null
                }
            });
        }
    }
}

module.exports = { replayCandles };
