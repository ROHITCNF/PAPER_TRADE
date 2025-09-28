const { MOCK_PROFILE, ORDERBOOK, POSITIONS, TRADEBOOK } = require("../util/constant");

async function getOrders(fyers) {    
    if (MOCK_PROFILE) {
        return ORDERBOOK;
    }
    return await fyers.get_orders();

}

async function getPositions(fyers) {
    if (MOCK_PROFILE) {
        return POSITIONS;
    }
    return await fyers.get_positions();

}

async function getTradeBook(fyers) {
    if (MOCK_PROFILE) {
        return Promise.resolve(TRADEBOOK);
    }
    return await fyers.get_tradebook();

}

module.exports = { getOrders, getPositions, getTradeBook };