// src/engine/backtestEngine.js
const { getDateFromTimestamp } = require("../../util/helper");
function runBacktest(strategy, candles, initialCapital = 100000) {
    let balance = initialCapital;
    let position = null;
    let trades = [];
  
    for (let i = 0; i < candles.length; i++) {
      const signal = strategy.generateSignal(candles, i, position);
  
      if (signal === "BUY" && !position) {
        position = { entryPrice: candles[i][4], entryIndex: i  , entryDate: getDateFromTimestamp(candles[i][0])};
      }
  
      if (signal === "SELL" && position) {
        const exitPrice = candles[i][4];
        const pnl = exitPrice - position.entryPrice;
        trades.push({ entry: position.entryPrice, exit: exitPrice, pnl , entryDate: position.entryDate, exitDate: getDateFromTimestamp(candles[i][0])});
        balance += pnl;
        position = null;
      }
    }
  
    const totalPnL = balance - initialCapital;
    const winRate = (trades.filter(t => t.pnl > 0).length / trades.length) * 100 || 0;
  
    return { strategy: strategy.name, trades, totalPnL, winRate, finalBalance: balance };
  }
  
  module.exports = { runBacktest };
  