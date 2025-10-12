// src/strategies/movingAverage.js
function SMA(data, period, index) {
    if (index < period) return null;
    const slice = data.slice(index - period, index);
    const sum = slice.reduce((acc, c) => acc + c[4], 0);
    return sum / period;
  }
  
  const movingAverageCrossover = {
    name: "Moving Average Crossover",
    params: { short: 10, long: 30 },
    generateSignal(candles, i, position) {
      const shortMA = SMA(candles, this.params.short, i);
      const longMA = SMA(candles, this.params.long, i);
  
      if (!shortMA || !longMA) return "HOLD";
  
      if (shortMA > longMA && !position) return "BUY";
      if (shortMA < longMA && position) return "SELL";
      return "HOLD";
    },
  };
  
  module.exports = movingAverageCrossover;
  