const { fyersModel: FyersAPI } = require('fyers-api-v3');
const { FYERS_APP_ID, REDIRECT_URL } = require('../utils/constant');

const MS_PER_DAY       = 86400 * 1000;
const CHUNK_DAYS       = 90;    // stay safely under the 100-day Fyers limit
const RESOLUTION       = '1';   // 1-minute candles
const INTER_CHUNK_DELAY = 200;  // ms between chunk requests to avoid rate limiting

function _fyersClient() {
    const fyers = new FyersAPI();
    fyers.setAppId(FYERS_APP_ID);
    fyers.setRedirectUrl(REDIRECT_URL);
    fyers.setAccessToken(process.env.ACCESS_TOKEN);
    return fyers;
}

// Splits [fromMs, toMs] into 90-day chunks and returns array of { from, to } in epoch seconds.
function _dateChunks(fromMs, toMs) {
    const chunks = [];
    let cursor = fromMs;
    while (cursor < toMs) {
        const end = Math.min(cursor + CHUNK_DAYS * MS_PER_DAY, toMs);
        chunks.push({
            from: Math.floor(cursor / 1000),
            to:   Math.floor(end   / 1000)
        });
        cursor = end + MS_PER_DAY; // skip one day to avoid overlap
    }
    return chunks;
}

function _parseCandles(raw) {
    return raw.map(c => ({
        timestamp: c[0],
        open:      c[1],
        high:      c[2],
        low:       c[3],
        close:     c[4],
        volume:    c[5]
    }));
}

// Fetches 1-minute candles for a symbol between fromDate and toDate (YYYY-MM-DD strings).
// Automatically chunks requests to stay within Fyers' 100-day limit.
async function fetchIntraday(symbol, fromDate, toDate) {
    const fyers  = _fyersClient();
    const fromMs = new Date(fromDate).getTime();
    const toMs   = new Date(toDate).getTime();
    const chunks = _dateChunks(fromMs, toMs);

    const allCandles = [];

    for (const chunk of chunks) {
        const response = await fyers.getHistory({
            symbol,
            resolution:  RESOLUTION,
            date_format: '0',
            range_from:  chunk.from.toString(),
            range_to:    chunk.to.toString(),
            cont_flag:   '1'
        });

        if (response.s !== 'ok') {
            if (response.code === -16) {
                const err = new Error('Fyers auth token expired (code -16)');
                err.isAuthError = true;
                throw err;
            }
            console.warn(`fetchIntraday: skipping chunk for ${symbol} — ${response.message || response.s}`);
            continue;
        }

        allCandles.push(..._parseCandles(response.candles));
        if (chunks.length > 1) await new Promise(r => setTimeout(r, INTER_CHUNK_DELAY));
    }

    // Sort ascending by timestamp (chunks should already be ordered, but be safe)
    allCandles.sort((a, b) => a.timestamp - b.timestamp);
    return allCandles;
}

module.exports = { fetchIntraday };
