// strategies/macd.js
function EMA(candles, period, index) {
    if (index < period) return null;
    let k = 2 / (period + 1);
    let ema = candles[index - period].close;
    for (let i = index - period + 1; i <= index; i++) {
      ema = candles[i][4] * k + ema * (1 - k);
    }
    return ema;
  }
  
  const macdStrategy = {
    name: "MACD Signal Crossover",
    params: { short: 12, long: 26, signal: 9 },
    generateSignal(candles, i, position) {
      const shortEMA = EMA(candles, this.params.short, i);
      const longEMA = EMA(candles, this.params.long, i);
      if (!shortEMA || !longEMA) return "HOLD";
  
      const macd = shortEMA - longEMA;
  
      // Signal line EMA of MACD
      let macdArray = [];
      for (let j = 0; j <= i; j++) macdArray.push(EMA(candles, this.params.short, j) - EMA(candles, this.params.long, j));
      const signalLine = EMA(macdArray.map(v => ({ close: v })), this.params.signal, i);
  
      if (macd > signalLine && !position) return "BUY";
      if (macd < signalLine && position) return "SELL";
      return "HOLD";
    },
  };
  
  module.exports = macdStrategy;
  