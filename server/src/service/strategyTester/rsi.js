// src/strategies/rsi.js
function calculateRSI(candles, period, index) {
    if (index < period) return null;
    let gains = 0, losses = 0;
  
    for (let i = index - period + 1; i <= index; i++) {
        //[timestamp , o , h , l , c , v]
      const diff = candles[i][4] - candles[i - 1][4];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
  
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
  
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }
  function generateSignal(candles, i, position){
    const rsi = calculateRSI(candles, this.params.period, i);
    if (!rsi) return "HOLD";

    if (rsi < this.params.oversold && !position) return "BUY";
    if (rsi > this.params.overbought && position) return "SELL";
    return "HOLD";
  }
  
  const rsiStrategy = {
    name: "RSI Overbought/Oversold",
    params: { period: 14, overbought: 70, oversold: 30 },
    generateSignal : generateSignal,
  };
  
  module.exports = rsiStrategy;
  