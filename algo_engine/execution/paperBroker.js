function createPaperBroker(capital = 100000) {
    const positions = {};
    let cash = capital;

    // LONG entry — deduct cash, expect price to rise
    function buy(symbol, price, qty) {
        positions[symbol] = { price, qty, side: 'LONG' };
        cash -= price * qty;
        console.log(`BUY   ${symbol} @ ${price} x${qty} | cash: ${cash.toFixed(2)}`);
    }

    // SHORT entry — receive cash (borrowed stock sold), expect price to fall
    function short(symbol, price, qty) {
        positions[symbol] = { price, qty, side: 'SHORT' };
        cash += price * qty;
        console.log(`SHORT ${symbol} @ ${price} x${qty} | cash: ${cash.toFixed(2)}`);
    }

    // Exit for both sides — covers SHORT, sells LONG
    function sell(symbol, price) {
        const pos = positions[symbol];
        if (!pos) return;

        let pnl;
        if (pos.side === 'SHORT') {
            pnl   = (pos.price - price) * pos.qty; // profit when price falls
            cash -= price * pos.qty;               // pay to buy back borrowed stock
            console.log(`COVER ${symbol} @ ${price} x${pos.qty} | PnL: ${pnl.toFixed(2)} | cash: ${cash.toFixed(2)}`);
        } else {
            pnl   = (price - pos.price) * pos.qty; // profit when price rises
            cash += price * pos.qty;
            console.log(`SELL  ${symbol} @ ${price} x${pos.qty} | PnL: ${pnl.toFixed(2)} | cash: ${cash.toFixed(2)}`);
        }

        delete positions[symbol];
    }

    function getPositions() { return { ...positions }; }
    function getCash()      { return cash; }

    return { buy, short, sell, getPositions, getCash };
}

module.exports = { createPaperBroker };
