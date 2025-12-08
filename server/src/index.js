const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const FyersAPI = require("fyers-api-v3").fyersModel;
require("dotenv").config();
const { connectToDb } = require("./service/lib/mongodb");
const port = process.env.PORT || 5001;

const corsOptions = {
  origin: "http://10.80.23.223:3001",
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

global.fyers = new FyersAPI();

const signupRouter = require("./routes/signup");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");

app.get("/", (req, res) => {
  res.status(200).send("Server is running");
});

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", signupRouter);

connectToDb().then(() => {
  console.log("Connected to MongoDB Successfully");
  startServer();
}).catch((error) => {
  console.log(error);
});

function startServer() {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
