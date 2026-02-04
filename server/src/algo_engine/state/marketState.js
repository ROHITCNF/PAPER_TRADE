function createMarketState(symbol) {
    return {
        symbol,
        ltp: null,
        volume: 0,
        depth: null,
        spread: null,
        vwap: null,
        obi: null,
        time: null,
        hasPosition: false
    };
}

module.exports = { createMarketState };
