const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const FyersAPI = require("fyers-api-v3").fyersModel;
require("dotenv").config();


const fyers = new FyersAPI()
const appId = process.env.FYERS_APP_ID;
fyers.setAppId(appId);
// Set the RedirectURL where the authorization code will be sent after the user grants access
fyers.setRedirectUrl("https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/");



const generateAuthCodeUrl = fyers.generateAuthCode();
console.log(generateAuthCodeUrl);


const authCode = process.env.FYERS_AUTH_CODE;
const secretKey = process.env.FYERS_SECRET_KEY;

fyers.generate_access_token({ "client_id": appId, "secret_key": "MEO0LYO6MD", "auth_code": authCode }).then((res) => {
  fyers.setAccessToken(res.access_token);
  fyers.get_profile().then((res) => {
    console.log(res);
  }).catch((err) => {
    console.log(err);
  });
}).catch((err) => {
  console.log(err);
});


app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
