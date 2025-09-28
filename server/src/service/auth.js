
require("dotenv").config();
const { getProfile, initiateMockProfileForUser } = require("./myProfile");
const { getOrders } = require("./transaction");
const { getHistoryData } = require("./data");
const { connectGeneralSocket } = require("../sockets/generalSocket");
const { connectDataSocket } = require("../sockets/dataSocket");

function generateAuthCodeUrl(fyers) {
    const generateAuthCodeUrl = fyers.generateAuthCode();
    console.log(generateAuthCodeUrl);
    generateAccessToken(fyers);
}

async function generateAccessToken(fyers) {
    const authCode = process.env.FYERS_AUTH_CODE;
    const secretKey = process.env.FYERS_SECRET_KEY;
    const appId = process.env.FYERS_APP_ID;
    const response = await fyers.generate_access_token({ "client_id": appId, "secret_key": "MEO0LYO6MD", "auth_code": authCode });
    fyers.setAccessToken(response?.access_token);

    // Initiate mock profile for user and create wallet for the user
    initiateMockProfileForUser(fyers);
    //Enable if required
    // connectGeneralSocket(response?.access_token);
    // connectDataSocket(response?.access_token);
}

module.exports = { generateAuthCodeUrl, generateAccessToken };