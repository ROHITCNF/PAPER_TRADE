async function getProfile(fyers) {
    const response = await fyers.get_profile();
   // console.log("PROFILE RESPONSE ",response);
    getFunds(fyers);
}
async function getFunds(fyers) {
    const response = await fyers.get_funds();
   // console.log("FUNDS RESPONSE ",response);
    getHoldings(fyers);
}
async function getHoldings(fyers) {
    const response = await fyers.get_holdings();
   //console.log("HOLDINGS RESPONSE ",response);
}

module.exports = { getProfile , getFunds , getHoldings };