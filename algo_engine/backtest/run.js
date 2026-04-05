require('dotenv').config({ path: '../.env.local' });

const { ensureTokens }   = require('../utils/generateToken');
const { loadStocksList } = require('../utils/helper');
const { runBacktest }    = require('./runner');
const { generateReport } = require('./report');

// ── Configure your backtest window here ──────────────────────────────────────
const FROM_DATE = '2025-01-01';
const TO_DATE   = '2025-03-31';
// ─────────────────────────────────────────────────────────────────────────────

(async () => {
    try {
        await ensureTokens();

        const symbols = loadStocksList();
        const trades  = await runBacktest(symbols, FROM_DATE, TO_DATE);

        await generateReport(trades, FROM_DATE, TO_DATE);
    } catch (err) {
        if (err.isAuthError) {
            console.error('Auth token expired during backtest. Re-run to re-authenticate.');
        } else {
            console.error('Backtest failed:', err);
        }
        process.exit(1);
    }
})();
