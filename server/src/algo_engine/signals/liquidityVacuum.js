function createLiquidityVacuum(window = 10) {
    const depthHistory = [];
    const spreadHistory = [];

    function totalDepth(depth) {
        return (
            depth.bids.reduce((s, b) => s + b.qty, 0) +
            depth.asks.reduce((s, a) => s + a.qty, 0)
        );
    }

    function update(depth) {
        const spread =
            depth.asks[0].price - depth.bids[0].price;

        depthHistory.push(totalDepth(depth));
        spreadHistory.push(spread);

        if (depthHistory.length > window) {
            depthHistory.shift();
            spreadHistory.shift();
        }
    }

    function detect() {
        if (depthHistory.length < window) return false;

        const avgDepth =
            depthHistory.reduce((a, b) => a + b, 0) / window;
        const avgSpread =
            spreadHistory.reduce((a, b) => a + b, 0) / window;

        const currDepth = depthHistory.at(-1);
        const currSpread = spreadHistory.at(-1);

        return (
            currDepth / avgDepth < 0.6 &&
            currSpread / avgSpread > 1.2
        );
    }

    return { update, detect };
}

module.exports = { createLiquidityVacuum };
