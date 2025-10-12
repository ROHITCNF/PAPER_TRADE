// strategies/volumeSpike.js
const volumeSpikeStrategy = {
    name: "Volume Spike",
    params: { period: 20, multiplier: 2 },
    generateSignal(candles, i, position) {
      if (i < this.params.period) return "HOLD";
      const avgVolume = candles.slice(i-this.params.period, i).reduce((a,c)=>a+c[5],0)/this.params.period;
  
      if (candles[i][5] > avgVolume * this.params.multiplier && !position) return "BUY";
      if (position) return "SELL";
      return "HOLD";
    },
  };
  module.exports = volumeSpikeStrategy;
  