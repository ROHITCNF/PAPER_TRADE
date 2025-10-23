const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const FyersAPI = require("fyers-api-v3").fyersModel;
require("dotenv").config();
const { connectToDb } = require("./service/lib/mongodb");

const corsOptions = {
  origin: "https://paper-trade-rho.vercel.app/",
  credentials: true,
};
//middileWare for express json
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

global.fyers = new FyersAPI();

const signupRouter = require("./routes/signup");
const authRouter = require("./routes/auth");

app.use("/", authRouter);
app.use("/", signupRouter);

connectToDb().then(() => {
  console.log("Connected to MongoDB Successfully");
  startServer();
}).catch((error) => {
  console.log(error);
});

function startServer(){
  app.listen(5000, () => {
    console.log("Server is running on port 5000");
  });
}
