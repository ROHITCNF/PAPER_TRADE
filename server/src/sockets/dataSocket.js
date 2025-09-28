const FyersSocket = require("fyers-api-v3").fyersDataSocket
require("dotenv").config();


function connectDataSocket(accessToken) {
    const authCode = process.env.FYERS_AUTH_CODE;
    var fyersdata = new FyersSocket(`${authCode}:${accessToken}`);

    function onmsg(message) {
        console.log(message)
    }

    function onconnect() {
        console.log("\x1b[32m%s\x1b[0m", "DATA socket connected");
        fyersdata.subscribe(['NSE:NIFTY50-INDEX']) //not subscribing for market depth data
        // fyersdata.mode(fyersdata.LiteMode) //set data mode to lite mode
        // fyersdata.mode(fyersdata.FullMode) //set data mode to full mode is on full mode by default
        fyersdata.autoreconnect(1) //enable auto reconnection mechanism in case of disconnection
    }

    function onerror(err) {
        console.log(err)
    }

    function onclose() {
        console.log("socket closed")
    }

    fyersdata.on("message", onmsg)
    fyersdata.on("connect", onconnect)
    fyersdata.on("error", onerror)
    fyersdata.on("close", onclose)

    fyersdata.connect()
}

module.exports = { connectDataSocket };

