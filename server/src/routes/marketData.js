const express = require("express");
const marketDataRouter = express.Router();
const { verifyUser } = require('../../middileware/authmiddleware');
const FyersAPI = require("fyers-api-v3").fyersModel;
marketDataRouter.get('/marketData/marketStatus', async (req, res) => {
    try {
        const webToken = JSON.parse(req.headers.authorization)?.web_token;
        const user = await verifyUser(webToken);
        if (!user) {
            return res.status(401).json({ code: 401, message: "User not authenticated Please login" });
        }
        const fyers = new FyersAPI();
        fyers.setAppId('VI5GXIR8UI-100');
        fyers.setAccessToken(JSON.parse(req.headers.authorization)?.access_token);
        fyers.market_status().then((response) => {
            return res.status(200).json({ code: 200, message: "Market status fetched successfully", data: response });
        }).catch((error) => {
            return res.status(400).json({ code: 400, message: "Error getting the market status", error: error });
        })
    } catch (error) {
        console.log(error);
        return res.status(400).json({ code: 400, message: "Error getting the market status", error: error });
    }
})
marketDataRouter.post('/merketData/quotes', async (req, res) => {
    try {
        const webToken = JSON.parse(req.headers.authorization)?.web_token;
        const user = await verifyUser(webToken);
        if (!user) {
            return res.status(401).json({ code: 401, message: "User not authenticated Please login" });
        }
        const fyers = new FyersAPI();
        fyers.setAppId('VI5GXIR8UI-100');
        fyers.setAccessToken(JSON.parse(req.headers.authorization)?.access_token);
        // console.log('req body', req?.body);
        const payload = req?.body;
        fyers.getQuotes(payload).then((response) => {
            return res.status(200).json({ code: 200, message: "Quotes fetched successfully", data: response });
        }).catch((error) => {
            return res.status(400).json({ code: 400, message: "Error getting the quotes", error: error });
        })
    } catch (error) {
        console.log(error);
        return res.status(400).json({ code: 400, message: "Error getting the market status", error: error });
    }
})

module.exports = marketDataRouter;

