async function getHistoryData(fyers) {
    //     Limits for History
    // Unlimited number of stocks history data can be downloaded in a day.
    // Up to 100 days of data per request for resolutions of 1, 2, 3, 5, 10, 15, 20, 30, 45, 60, 120, 180, and 240 minutes. Data is available from July 3, 2017.
    // For 1D resolutions up to 366 days of data per request for 1D (1 day) resolutions.
    // For Seconds Charts the history will be available only for 30-Trading Days
    var inp={
        "symbol":"NSE:NIFTY50-INDEX",
        "resolution":"D",
        "date_format":"0",
        "range_from":"1735720738",
        "range_to":"1759048787",
        "cont_flag":"1"
    }
    const data = await fyers.getHistory(inp);       
   // console.log("HISTORY DATA ",data);
    getQuotesData(fyers);
}

async function getQuotesData(fyers){
    const data = await fyers.getQuotes(["NSE:NIFTY50-INDEX"]);
   //console.log("QUOTES DATA ",data);
    getMarketDepthData(fyers);
}

async function getMarketDepthData(fyers){
    const req = {"symbol":["NSE:NIFTY50-INDEX"], "ohlcv_flag":"1"};
    const data = await fyers.getMarketDepth(req);
   // console.log("MARKET DEPTH DATA ",data);
    getOptionChainData(fyers);
}

async function getOptionChainData(fyers){
    const req = {"symbol":"NSE:NIFTY50-INDEX","strikecount" : 10};
    const data = await fyers.getOptionChain(req);
    console.log("OPTION CHAIN DATA ",data);
}

module.exports = { getHistoryData };