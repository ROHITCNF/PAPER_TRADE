const FyersOrderSocket = require("fyers-api-v3").fyersOrderSocket
require("dotenv").config();

function connectGeneralSocket(accessToken) {
    const authCode = process.env.FYERS_AUTH_CODE;
    let fyersOrderdata = new FyersOrderSocket(`${authCode}:${accessToken}`);

    fyersOrderdata.on("error", function (errmsg) {
        console.log(errmsg)
    })

    //for ticks of general data like price-alerts,EDIS
    fyersOrderdata.on('general', function (msg) {
        console.log(msg)
    })
    fyersOrderdata.on('connect', function () {
        console.log("\x1b[32m%s\x1b[0m", "GENERAL socket connected");
        fyersOrderdata.subscribe([fyersOrderdata.orderUpdates, fyersOrderdata.tradeUpdates, fyersOrderdata.positionUpdates, fyersOrderdata.edis, fyersOrderdata.pricealerts])
    })
    fyersOrderdata.on('close', function () {
        console.log('closed')
    })

    //for ticks of orderupdates
    fyersOrderdata.on('orders', function (msg) {
        console.log("orders", msg)
    })

    //for ticks of tradebook
    fyersOrderdata.on('trades', function (msg) {
        console.log('trades', msg)
    })

    //for ticks of positions
    fyersOrderdata.on('positions', function (msg) {
        console.log('positions', msg)
    })
    fyersOrderdata.autoreconnect(1)
    fyersOrderdata.connect()
}

module.exports = { connectGeneralSocket };

