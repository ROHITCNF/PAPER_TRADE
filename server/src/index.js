const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const FyersAPI = require("fyers-api-v3").fyersModel;
require("dotenv").config();
const { generateAuthCodeUrl, generateAccessToken } = require("./service/auth");

global.fyers = new FyersAPI()
const appId = process.env.FYERS_APP_ID;
global.fyers.setAppId(appId);
// Set the RedirectURL where the authorization code will be sent after the user grants access
global.fyers.setRedirectUrl("https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/");



generateAuthCodeUrl(); // initiate auth

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
