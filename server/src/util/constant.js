let MOCK_PROFILE = true;

let FUNDS_DATA = [
    {
        title: 'Current Balance',
        amount: 100000.00
    },
    {
        title: 'Limit at start of the day',
        amount: 100000.00
    }
]
let ORDERBOOK = [];
let TRADEBOOK = [];
let POSITIONS = {
    netPositions: [],
    overall: {
        count_open: 0,
        count_total: 0,
        pl_realized: 0,
        pl_total: 0,
        pl_unrealized: 0
    }
};

module.exports = { MOCK_PROFILE, FUNDS_DATA , ORDERBOOK , TRADEBOOK , POSITIONS };