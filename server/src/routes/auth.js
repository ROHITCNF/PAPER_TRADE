const express = require("express");
const authRouter = express.Router();
const { redirectUrl } = require("../util/constant");
const User = require("../service/models/user");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "rohit@cnf12345"; 

const verifyUser = async (token) => {

    if (!token) throw new Error("No token provided");

    const decodedMessage = jwt.verify(token, SECRET_KEY);
    const userObj = await User.findOne({ _id: decodedMessage._id });

    if (!userObj) throw new Error("User not authenticated");

    return userObj;
};

authRouter.get("/verify_token",  async (req, res) => {
    try {
        //This function should verify the access token and return the user details
        //if not verified then normal login flow should work
        const webToken = JSON.parse(req.headers.authorization).web_token;
        const user = await verifyUser(webToken);
        if(!user){
            return res.status(401).json({code: 401, message: "User not authenticated Please login" });
        }
        // user is verified now we have to set accesstoken in fyersobject 
        const authCode = JSON.parse(req.headers.authorization).auth_code;
        const accessToken = JSON.parse(req.headers.authorization).access_token;

        process.env.FYERS_APP_ID = user?.fyersAppId;
        process.env.FYERS_SECRET_KEY = user?.fyersSecretKey;
        global.fyers.setAppId(process.env.FYERS_APP_ID);
        global.fyers.setRedirectUrl(redirectUrl);
        global.fyers.setAccessToken(accessToken);

        res.status(200).json({code: 200, message: "User authenticated successfully"});
    } catch (error) {
        console.log(error);
        res.status(401).json({code : 401, message: "User not authenticated , Please login" });
    }
});
authRouter.post("/generate_auth_code_url",  async (req, res) => {
    try {        
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if(!user){
            return res.status(401).json({ message: "User not found" });
        }
        const isPasswordCorrect = await user.validateUserPassword(password);
        if(!isPasswordCorrect){
            return res.status(401).json({ message: "Invalid password" });
        }

        process.env.FYERS_APP_ID = user?.fyersAppId;
        process.env.FYERS_SECRET_KEY = user?.fyersSecretKey;
        global.fyers.setAppId(process.env.FYERS_APP_ID);
        global.fyers.setRedirectUrl(redirectUrl);
        const generateAuthCodeUrl = global.fyers.generateAuthCode();
        const token = await user.getJWT();
        res.status(200).json({code: 200, message: "Auth code generated successfully", url: generateAuthCodeUrl  , web_token:token});
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error generating auth code", error: error.message });
    }
});

authRouter.post("/generate_access_token",  async (req, res) => {    
    try {
        const { authCode } = req.body;
        const response = await global.fyers.generate_access_token({ "client_id": process.env.FYERS_APP_ID, "secret_key": process.env.FYERS_SECRET_KEY, "auth_code": authCode });
        global.fyers.setAccessToken(response?.access_token);
        console.log(response);
        res.status(200).json({ message: "Access token generated successfully", accessToken: response.access_token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error generating access token", error: error.message });
    }
});




module.exports = authRouter;    