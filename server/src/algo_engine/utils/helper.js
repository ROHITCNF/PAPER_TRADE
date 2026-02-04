function normalizeDepth(raw) {
    const bids = [];
    const asks = [];

    for (let i = 1; i <= 5; i++) {
        const bp = raw[`bid_price${i}`];
        const bq = raw[`bid_size${i}`];
        const bo = raw[`bid_order${i}`];

        if (bp > 0 && bq > 0) {
            bids.push({
                price: bp,
                qty: bq,
                orders: bo || 0
            });
        }

        const ap = raw[`ask_price${i}`];
        const aq = raw[`ask_size${i}`];
        const ao = raw[`ask_order${i}`];

        if (ap > 0 && aq > 0) {
            asks.push({
                price: ap,
                qty: aq,
                orders: ao || 0
            });
        }
    }

    // If either side missing → depth unusable
    if (bids.length === 0 || asks.length === 0) {
        return null;
    }

    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;

    return {
        bids,
        asks,
        bestBid,
        bestAsk,
        spread: bestAsk - bestBid,
        timestamp: Date.now()
    };
}


module.exports = { normalizeDepth };
