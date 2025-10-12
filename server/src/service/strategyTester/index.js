const { runBacktest } = require("./engine");
const movingAverageCrossover = require("./ma_crossover");
const rsiStrategy = require("./rsi");
const bollingerStrategy = require("./bollinger_band_bounce");
const breakoutStrategy = require("./breakout");
const emaPullbackStrategy = require("./ema_pullback");
const goldenDeathStrategy = require("./golden_death_cross");
const insideBarStrategy = require("./inside_bar_breakout");
const macdStrategy = require("./macd_signal_cross");
const supertrendStrategy = require("./supertrend_reversal");
const volumeSpikeStrategy = require("./volume_spike");
const { getHistoryData } = require("../data");

async function getCandles (){
    const input = {
        "symbol":"NSE:SBIN-EQ",
        "resolution":"D",
        "date_format":"0",
        "range_from":"1735702223",
        "range_to":"1760271776",
        "cont_flag":"1"
    };
    const candleData = await getHistoryData(input);
    return candleData?.candles;
}

async function testStrategies(){
    const candles = await getCandles();

//   const maResult = runBacktest(movingAverageCrossover, candles);
//   console.log("📈 MA Result:", maResult);

//   const rsiResult = runBacktest(rsiStrategy, candles);
//   console.log("📊 RSI Result:", rsiResult);

    // const bollingerResult = runBacktest(bollingerStrategy, candles);
    // console.log("📈 Bollinger Result:", bollingerResult);

    // const breakoutResult = runBacktest(breakoutStrategy, candles);
    // console.log("📈 Breakout Result:", breakoutResult);

    // const emaPullbackResult = runBacktest(emaPullbackStrategy, candles);
    // console.log("📈 EMA Pullback Result:", emaPullbackResult);

    // const goldenDeathResult = runBacktest(goldenDeathStrategy, candles);
    // console.log("📈 Golden Death Result:", goldenDeathResult);

    // const insideBarResult = runBacktest(insideBarStrategy, candles);
    // console.log("📈 Inside Bar Result:", insideBarResult);

    // const macdResult = runBacktest(macdStrategy, candles);
    // console.log("📈 MACD Result:", macdResult);

    // const supertrendResult = runBacktest(supertrendStrategy, candles);
    // console.log("📈 Supertrend Result:", supertrendResult);

    // const volumeSpikeResult = runBacktest(volumeSpikeStrategy, candles);
    // console.log("📈 Volume Spike Result:", volumeSpikeResult);
}

module.exports = { testStrategies };
