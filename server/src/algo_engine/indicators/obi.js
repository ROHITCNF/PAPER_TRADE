function createOBI(levels = 10, smooth = 10) {
    const history = [];

    function update(depth) {
        let bidSum = 0;
        let askSum = 0;

        for (let i = 0; i < levels; i++) {
            bidSum += depth.bids[i]?.qty || 0;
            askSum += depth.asks[i]?.qty || 0;
        }

        if (bidSum + askSum === 0) return null;

        const obi = (bidSum - askSum) / (bidSum + askSum);
        history.push(obi);
        if (history.length > smooth) history.shift();

        return get();
    }

    function get() {
        return history.reduce((a, b) => a + b, 0) / history.length;
    }

    return { update, get };
}

module.exports = { createOBI };
