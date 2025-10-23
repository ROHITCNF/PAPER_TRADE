const express = require("express");
const signupRouter = express.Router();
const userModel = require("../service/models/user");
const bcrypt = require("bcrypt");

signupRouter.post("/signup", async (req, res) => {
    try {
        const payload = req.body;
        const user = await userModel.findOne({ email: payload?.email });
        if (user) {
            return res.status(200).json({ code: 401, message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(payload.password, 10);
       
        const newUser = await userModel.create({ email: payload.email, password: hashedPassword, fyersAppId: payload.appId, fyersSecretKey: payload.secretId });
        const token = await newUser.getJWT();
        res.status(200).json({ code: 200, message: "Signup successful", newUser});
    } catch (error) {
       console.log(error);
       res.status(500).json({ message: "Error signing up", error: error.message });
    }
});

module.exports = signupRouter;