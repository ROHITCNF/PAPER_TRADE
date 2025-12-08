const User = require('../src/service/models/user');
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "rohit@cnf12345";

const verifyUser = async (token) => {

    if (!token) throw new Error("No token provided");

    const decodedMessage = jwt.verify(token, SECRET_KEY);
    const userObj = await User.findOne({ _id: decodedMessage._id });

    if (!userObj) throw new Error("User not authenticated");

    return userObj;
};

module.exports = { verifyUser };
