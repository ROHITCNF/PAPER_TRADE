require('dotenv').config({ path: '.env.local' });

const { ensureTokens }  = require('./utils/generateToken');
const { loadStocksList } = require('./utils/helper');
const { start }          = require('./engine/startAlgo');

(async () => {
    try {
        await ensureTokens();
        const symbols = loadStocksList();
        await start(symbols);
    } catch (err) {
        if (err.isAuthError) {
            console.warn('Tokens expired. Restarting authentication flow...');
            delete process.env.ACCESS_TOKEN;
            delete process.env.AUTH_TOKEN;
            await ensureTokens();
            const symbols = loadStocksList();
            await start(symbols);
        } else {
            console.error('Fatal error:', err);
            process.exit(1);
        }
    }
})();
