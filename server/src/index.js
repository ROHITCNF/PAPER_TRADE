const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const FyersAPI = require("fyers-api-v3").fyersModel;
require("dotenv").config();
const { connectToDb } = require("./service/lib/mongodb");
const port = process.env.PORT || 5001;
const { redirectUrl } = require("./util/constant");
const { startAlgo } = require("./algo_engine/start_algo");
const { equityStocks, access_token } = require("../src/algo_engine/utils/constant");

const isFullStack = false;

const corsOptions = {
  origin: "http://192.168.1.31:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
// const corsOptions_v2 = {
//   origin: "https://paper-trade-rho.vercel.app", // your frontend
//   methods: "*",        // allow all HTTP methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
//   allowedHeaders: "*", // allow all headers (Content-Type, Authorization, etc.)
//   credentials: true    // allow cookies/auth if needed
// };

//middileWare for express json
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));


if (isFullStack) {
  const signupRouter = require("./routes/signup");
  const authRouter = require("./routes/auth");
  const profileRouter = require("./routes/profile");
  const marketDataRouter = require("./routes/marketData");
  app.use("/", authRouter);
  app.use("/", profileRouter);
  app.use("/", marketDataRouter);
  app.use("/", signupRouter);
}

app.get("/", (req, res) => {
  res.status(200).send("Server is running");
});


if (!isFullStack) {
  startServer();
  global.fyers = new FyersAPI();
  global.fyers.setAppId('VI5GXIR8UI-100');
  global.fyers.setRedirectUrl(redirectUrl);
  global.fyers.setAccessToken(access_token);
}



// Uncomment to run Fullstack
if (isFullStack) {
  connectToDb().then(() => {
    console.log("Connected to MongoDB Successfully");
    startServer();
  }).catch((error) => {
    console.log(error);
  });
}
if (!isFullStack) {
  startAlgo(
    equityStocks
  );
}
function startServer() {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
