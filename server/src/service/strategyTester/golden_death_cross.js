// strategies/goldenDeath.js
function EMA(candles, period, index) {
    if (index < period) return null; // not enough data yet
  
    const k = 2 / (period + 1); // smoothing factor
    let ema = candles[index - period].close; // start with first close
  
    for (let i = index - period + 1; i <= index; i++) {
      ema = candles[i][4] * k + ema * (1 - k); // EMA formula
    }
  
    return ema;
  }
const goldenDeathStrategy = {
    name: "Golden/Death Cross",
    params: { short: 50, long: 200 },
    generateSignal(candles, i, position) {
      const shortEMA = EMA(candles, this.params.short, i);
      const longEMA = EMA(candles, this.params.long, i);
      if (!shortEMA || !longEMA) return "HOLD";
  
      if (shortEMA > longEMA && !position) return "BUY";
      if (shortEMA < longEMA && position) return "SELL";
      return "HOLD";
    },
  };
  module.exports = goldenDeathStrategy;
  