const FyersAPI = require("fyers-api-v3").fyersModel
const { access_token, FYERS_APP_ID, redirect_url } = require('../utils/constant');
const DAY_SECONDS = 86400;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateADR(candles, lookback = 20) {
    const recent = candles.slice(-lookback);

    const ranges = recent.map(c => (c.high - c.low) / c.close);

    const avg = ranges.reduce((a, b) => a + b, 0) / ranges.length;
    return avg; // decimal (e.g. 0.021 = 2.1%)
}

function calculateAvgVolume(candles, lookback = 20) {
    const recent = candles.slice(-lookback);
    return recent.reduce((sum, c) => sum + c.volume, 0) / recent.length;
}

async function preloadSymbolHistory(fyers, symbol) {
    const now = Math.floor(Date.now() / 1000);
    const from = now - DAY_SECONDS * 365;

    const params = {
        symbol,
        resolution: "D",
        date_format: "0",
        range_from: from.toString(),
        range_to: now.toString(),
        cont_flag: "1"
    };

    const response = await fyers.getHistory(params);

    if (response.s !== "ok") {
        throw new Error(`History fetch failed for ${symbol}`);
    }

    const candles = response.candles.map(c => ({
        timestamp: c[0],
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[5]
    }));

    const prevDay = candles[candles.length - 2];
    const adrPercent = calculateADR(candles);
    const avgDailyVolume = calculateAvgVolume(candles);

    return {
        symbol,
        context: {
            prevDay,
            adrPercent,
            avgDailyVolume
        }
    };
}

async function preloadAllSymbols(symbols, delayMs = 300) {
    const fyers = new FyersAPI();
    fyers.setAppId(FYERS_APP_ID);
    fyers.setRedirectUrl(redirect_url);
    fyers.setAccessToken(access_token);

    const results = {};

    for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];

        try {
            // console.log(`📥 Preloading ${symbol} (${i + 1}/${symbols.length})`);

            const data = await preloadSymbolHistory(fyers, symbol);
            results[symbol] = data.context;

        } catch (err) {
            console.error(`❌ Preload failed for ${symbol}:`, err.message);
        }

        // ⏱️ THROTTLE — ALWAYS WAIT
        await sleep(delayMs);
    }
    // console.log(results);

    return results;
}


module.exports = {
    preloadAllSymbols
};
