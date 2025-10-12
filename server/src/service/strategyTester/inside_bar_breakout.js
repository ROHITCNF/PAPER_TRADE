// strategies/insideBar.js
const insideBarStrategy = {
    name: "Inside Bar Breakout",
    generateSignal(candles, i, position) {
      if (i < 1) return "HOLD";
      const prev = candles[i-1];
      const curr = candles[i];
      const currHigh = curr[2];
      const currLow = curr[3];
      const prevHigh = prev[2];
      const prevLow = prev[3];
      if (currHigh < prevHigh && currLow > prevLow && !position) return "BUY";
      if (currHigh > prevHigh && position) return "SELL";
      return "HOLD";
    },
  };
  module.exports = insideBarStrategy;
  