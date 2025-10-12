// strategies/bollinger.js
function getSMA(candles, period, index) {
    if (index < period) return null;
    const slice = candles.slice(index - period, index);
    const sum = slice.reduce((acc, c) => acc + c[4], 0);
    return sum / period;
  }
  
  function getStdDev(candles, period, index) {
    if (index < period) return null;
    const slice = candles.slice(index - period, index);
    const mean = getSMA(candles, period, index);
    const variance = slice.reduce((acc, c) => acc + (c[4] - mean) ** 2, 0) / period;
    return Math.sqrt(variance);
  }
  
  const bollingerStrategy = {
    name: "Bollinger Band Bounce",
    params: { period: 20, stdDevMultiplier: 2 },
    generateSignal(candles, i, position) {
      const sma = getSMA(candles, this.params.period, i);
      const stdDev = getStdDev(candles, this.params.period, i);
      if (!sma || !stdDev) return "HOLD";
  
      const upperBand = sma + this.params.stdDevMultiplier * stdDev;
      const lowerBand = sma - this.params.stdDevMultiplier * stdDev;
  
      if (candles[i][4] <= lowerBand && !position) return "BUY";
      if (candles[i][4] >= upperBand && position) return "SELL";
      return "HOLD";
    },
  };
  
  module.exports = bollingerStrategy;
  