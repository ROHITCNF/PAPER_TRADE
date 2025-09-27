const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fyers = require("fyers-api-v3");

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
