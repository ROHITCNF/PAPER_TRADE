const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

//create user scheama
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    fyersAppId: {
        type: String,
        required: true,
        unique: true,
    },
    fyersSecretKey: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },

}, { timestamps: true });

//user schema methods 
userSchema.methods.getJWT = async function () {
    const user = this;
    const token = jwt.sign({ _id: user?._id }, "rohit@cnf12345", {
        expiresIn: "1d",
    });
    return token;
};

userSchema.methods.validateUserPassword = async function (incomingPassword) {
    try {
        const user = this;
        const hashedPassword = user?.password;
        const isCorrectPassword = await bcrypt.compare(
            incomingPassword,
            hashedPassword
        );
        return isCorrectPassword;
    } catch (error) {
        console.log(error);
        return false;
    }
};
//create user model
const userModel = mongoose.model("user", userSchema);

module.exports = userModel;