// strategies/emaPullback.js
function EMA(candles, period, index) {
    if (index < period) return null; // not enough data yet
  
    const k = 2 / (period + 1); // smoothing factor
    let ema = candles[index - period].close; // start with first close
  
    for (let i = index - period + 1; i <= index; i++) {
      ema = candles[i][4] * k + ema * (1 - k); // EMA formula
    }
  
    return ema;
  }
  
const emaPullbackStrategy = {
    name: "EMA Pullback",
    params: { emaPeriod: 20 },
    generateSignal(candles, i, position) {
      const ema = EMA(candles, this.params.emaPeriod, i);
      if (!ema) return "HOLD";
  
      if (candles[i][4] < ema && !position) return "BUY"; // pullback near EMA
      if (candles[i][4] > ema && position) return "SELL";
      return "HOLD";
    },
  };
  module.exports = emaPullbackStrategy;
  