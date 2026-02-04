function createPaperBroker(capital = 100000) {
    const positions = {};

    function buy(symbol, price, qty) {
        positions[symbol] = { price, qty };
        console.log(`BUY ${symbol} @ ${price}`);
    }

    function sell(symbol, price) {
        const pos = positions[symbol];
        if (!pos) return;

        const pnl = (price - pos.price) * pos.qty;
        delete positions[symbol];
        console.log(`SELL ${symbol} @ ${price} | PnL: ${pnl}`);
    }

    return { buy, sell };
}

module.exports = { createPaperBroker };
