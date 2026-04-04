function createVWAP() {
    let cumPV = 0;
    let cumVol = 0;

    function updateFromTick(price, qty) {
        cumPV += price * qty;
        cumVol += qty;
        return get();
    }

    function updateFromCandle(candle) {
        const typical = (candle.high + candle.low + candle.close) / 3;
        cumPV += typical * candle.volume;
        cumVol += candle.volume;
        return get();
    }

    function get() {
        if (cumVol === 0) return null;
        return cumPV / cumVol;
    }

    function reset() {
        cumPV = 0;
        cumVol = 0;
    }

    return { updateFromTick, updateFromCandle, get, reset };
}

module.exports = { createVWAP };
