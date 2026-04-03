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
        time: null,
        hasPosition: false,
        dayVolume: 0,
        // 🔹 NEW: daily structure
        dayStats: {
            open: null,
            high: null,
            low: null,
            prevClose: null,
            chp: null,
            upperCkt: null,
            lowerCkt: null
        }
    };
}

module.exports = { createMarketState };
