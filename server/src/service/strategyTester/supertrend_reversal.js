// strategies/supertrend.js
function ATR(candles, period, index) {
    if (index < period) return null;
    let trs = [];
    for (let i = index - period + 1; i <= index; i++) {
      const highLow = candles[i][2] - candles[i][3];
      const highClose = Math.abs(candles[i][2] - candles[i-1][4]);
      const lowClose = Math.abs(candles[i][3] - candles[i-1][4]);
      trs.push(Math.max(highLow, highClose, lowClose));
    }
    return trs.reduce((a,b)=>a+b,0)/period;
  }
  
  const supertrendStrategy = {
    name: "Supertrend Reversal",
    params: { period: 10, multiplier: 3 },
    generateSignal(candles, i, position) {
      const atr = ATR(candles, this.params.period, i);
      if (!atr) return "HOLD";
      const basicUpper = (candles[i][2] + candles[i][3])/2 + this.params.multiplier * atr;
      const basicLower = (candles[i][2] + candles[i][3])/2 - this.params.multiplier * atr;
      if (candles[i][4] > basicUpper && !position) return "BUY";
      if (candles[i][4] < basicLower && position) return "SELL";
      return "HOLD";
    },
  };
  
  module.exports = supertrendStrategy;
  