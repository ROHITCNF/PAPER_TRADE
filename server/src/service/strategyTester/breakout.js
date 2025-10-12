// strategies/breakout.js
const breakoutStrategy = {
    name: "Breakout Strategy",
    params: { period: 20 },
    generateSignal(candles, i, position) {
      if (i < this.params.period) return "HOLD";
      const slice = candles.slice(i - this.params.period, i);
      const high = Math.max(...slice.map(c => c[2]));
      const low = Math.min(...slice.map(c => c[3]));
  
      if (candles[i][4] > high && !position) return "BUY";
      if (candles[i][4] < low && position) return "SELL";
      return "HOLD";
    },
  };
  
  module.exports = breakoutStrategy;
  