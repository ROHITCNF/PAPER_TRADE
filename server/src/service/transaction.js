async function getOrders(fyers){
    const response = await fyers.get_orders();
    console.log("ORDERS RESPONSE ",response);
    getPositions(fyers);
}

async function getPositions(fyers){
    const response = await fyers.get_positions();
    console.log("POSITIONS RESPONSE ",response);
    getTradeBook(fyers);
}

async function getTradeBook(fyers){
    const response = await fyers.get_tradebook();
    console.log("TRADE BOOK RESPONSE ",response);
}

module.exports = { getOrders , getPositions , getTradeBook };