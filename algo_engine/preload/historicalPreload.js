const FyersAPI = require('fyers-api-v3').fyersModel;
const { FYERS_APP_ID, REDIRECT_URL } = require('../utils/constant');

const DAY_SECONDS = 86400;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateADR(candles, lookback = 20) {
    const recent = candles.slice(-lookback);
    const ranges = recent.map(c => (c.high - c.low) / c.close);
    return ranges.reduce((a, b) => a + b, 0) / ranges.length;
}

function calculateAvgVolume(candles, lookback = 20) {
    const recent = candles.slice(-lookback);
    return recent.reduce((sum, c) => sum + c.volume, 0) / recent.length;
}

async function preloadSymbolHistory(fyers, symbol) {
    const now  = Math.floor(Date.now() / 1000);
    const from = now - DAY_SECONDS * 365;

    const response = await fyers.getHistory({
        symbol,
        resolution: 'D',
        date_format: '0',
        range_from: from.toString(),
        range_to:   now.toString(),
        cont_flag:  '1'
    });
    // console.log(response);

    if (response.s !== 'ok') {
        if (response.code === -16) {
            const err = new Error('Fyers auth token expired (code -16)');
            err.isAuthError = true;
            throw err;
        }
        throw new Error(`History fetch failed for ${symbol}: ${response.message || response.s}`);
    }

    const candles = response.candles.map(c => ({
        timestamp: c[0],
        open:      c[1],
        high:      c[2],
        low:       c[3],
        close:     c[4],
        volume:    c[5]
    }));

    return {
        symbol,
        context: {
            prevDay:         candles[candles.length - 2],
            adrPercent:      calculateADR(candles),
            avgDailyVolume:  calculateAvgVolume(candles)
        }
    };
}

// Preloads all symbols sequentially with a delay to avoid Fyers rate limits.
async function preloadAllSymbols(symbols, delayMs = 300) {
    const fyers = new FyersAPI();
    fyers.setAppId(FYERS_APP_ID);
    fyers.setRedirectUrl(REDIRECT_URL);
    fyers.setAccessToken(process.env.ACCESS_TOKEN); // read at call-time so auth flow value is used

    const results = {};

    for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        try {
            const data = await preloadSymbolHistory(fyers, symbol);
            results[symbol] = data.context;
        } catch (err) {
            if (err.isAuthError) throw err; // propagate to trigger re-auth in index.js
            console.error(`Preload failed for ${symbol}:`, err);
        }
        await sleep(delayMs);
    }

    return results;
}

module.exports = { preloadAllSymbols };
