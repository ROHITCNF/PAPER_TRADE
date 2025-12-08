const express = require("express");
const profileRouter = express.Router();
const { verifyUser } = require('../../middileware/authmiddleware');
const { getProfile } = require('../../src/service/myProfile');
const FyersAPI = require("fyers-api-v3").fyersModel;

profileRouter.get('/profile', async (req, res) => {
    try {
        const webToken = JSON.parse(req.headers.authorization)?.web_token;
        const user = await verifyUser(webToken);
        if (!user) {
            return res.status(401).json({ code: 401, message: "User not authenticated Please login" });
        }
        const fyers = new FyersAPI();
        fyers.setAppId('VI5GXIR8UI-100');
        fyers.setAccessToken(JSON.parse(req.headers.authorization)?.access_token);
        fyers.get_profile().then((response) => {
            console.log(response)
        }).catch((error) => {
            console.log(error)
        })
        //const profileData = await getProfile(global.fyers);
        return res.status(200).json({ code: 200, message: "Profile data fetched successfully", data: {} });
    } catch (error) {
        console.log(error);
        return res.status(400).json({ code: 400, message: "Error getting the profile data", error: error });
    }
})

module.exports = profileRouter;