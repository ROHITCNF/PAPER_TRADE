const { MOCK_PROFILE, FUNDS_DATA } = require("../util/constant");
const { getOrders, getPositions, getTradeBook } = require("./transaction");
async function getProfile(fyers) {
    const response = await fyers.get_profile();
    return response;

}
async function getFunds(fyers) {
    if (MOCK_PROFILE) {
        return FUNDS_DATA;
    }
    return await fyers.get_funds();
}
async function getHoldings(fyers) {
    const response = await fyers.get_holdings();
}
async function initiateMockProfileForUser(fyers) {
    const funds = await getFunds(fyers);
    console.log("Funds Data", funds);

    const orders = await getOrders(fyers);
    console.log("Orders Data", orders);

    const positions = await getPositions(fyers);
    console.log("Positions Data", positions);

    const tradeBook = await getTradeBook(fyers);
    console.log("Trade Book Data", tradeBook);

    setTimeout(async () => {
        FUNDS_DATA[0].amount = 99999.00;
        const funds = await getFunds(fyers);
        console.log("Funds Data", funds);
    }, 5000);
}


module.exports = { getProfile, getFunds, getHoldings, initiateMockProfileForUser };