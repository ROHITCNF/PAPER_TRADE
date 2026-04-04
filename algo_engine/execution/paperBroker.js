function createPaperBroker(capital = 100000) {
    const positions = {};
    let cash = capital;

    function buy(symbol, price, qty) {
        const cost = price * qty;
        positions[symbol] = { price, qty, cost };
        cash -= cost;
        console.log(`BUY  ${symbol} @ ${price} x${qty} | cash remaining: ${cash.toFixed(2)}`);
    }

    function sell(symbol, price) {
        const pos = positions[symbol];
        if (!pos) return;

        const pnl = (price - pos.price) * pos.qty;
        cash += price * pos.qty;
        delete positions[symbol];
        console.log(`SELL ${symbol} @ ${price} x${pos.qty} | PnL: ${pnl.toFixed(2)} | cash: ${cash.toFixed(2)}`);
    }

    function getPositions() {
        return { ...positions };
    }

    function getCash() {
        return cash;
    }

    return { buy, sell, getPositions, getCash };
}

module.exports = { createPaperBroker };
