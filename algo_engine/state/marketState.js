function createMarketState(symbol, context) {
    return {
        symbol,
        context,
        ltp: null,
        volume: 0,
        depth: null,
        spread: null,
        vwap: null,
        obi: null,
        candle: null,  // set by wireEngine in backtest (full candle OHLCV); null in live
        time: null,
        dayVolume: 0,
        dayStats: {
            open: null,
            high: null,
            low: null,
            prevClose: null,
            chp: null,
            upperCkt: null,
            lowerCkt: null
        },
        // Keyed by strategyId — supports multiple strategies per symbol
        // e.g. { openingMomentum: true }
        positions: {}
    };
}

module.exports = { createMarketState };
