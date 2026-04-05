const { preloadAllSymbols }    = require('../preload/historicalPreload');
const { createEventBus }       = require('../engine/eventBus');
const { wireEngine }           = require('../engine/engine');
const { createMarketState }    = require('../state/marketState');
const { createVWAP }           = require('../indicators/vwap');
const { createOBI }            = require('../indicators/obi');
const { createLiquidityVacuum } = require('../signals/liquidityVacuum');
const { createRiskEngine }     = require('../risk/riskEngine');
const { createOpeningMomentum } = require('../strategies/openingMomentum');
const { createBacktestBroker } = require('./backtestBroker');
const { fetchIntraday }        = require('./fetchIntraday');
const { replayCandles }        = require('./candleReplay');

const INTER_SYMBOL_DELAY_MS = 300; // respect Fyers rate limits

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBacktest(symbols, fromDate, toDate) {
    console.log(`\nBacktest: ${fromDate} → ${toDate} | ${symbols.length} symbols\n`);

    // Shared broker records all trades across symbols
    const broker = createBacktestBroker();

    // Shared risk engine (same as live setup)
    const riskEngine = createRiskEngine({});

    // Preload daily context (ADR, avgDailyVolume, prevDay) for all symbols
    console.log('Preloading historical context...');
    const contexts = await preloadAllSymbols(symbols);
    console.log('Context loaded.\n');

    for (const symbol of symbols) {
        const context = contexts[symbol];
        if (!context) {
            console.warn(`Skipping ${symbol} — no context loaded`);
            continue;
        }

        console.log(`── ${symbol}`);

        // Fetch 1-min intraday candles for the test period
        let candles;
        try {
            candles = await fetchIntraday(symbol, fromDate, toDate);
        } catch (err) {
            if (err.isAuthError) throw err;
            console.warn(`  fetchIntraday failed: ${err.message}`);
            continue;
        }

        if (candles.length === 0) {
            console.warn(`  No candles returned — skipping`);
            continue;
        }

        // Build one full pipeline per symbol (mirrors live startAlgo.js setup)
        const eventBus = createEventBus();
        const state    = createMarketState(symbol, context);

        const indicators = {
            vwap:   createVWAP(),
            obi:    createOBI(),            // never updated (no depth) — state.obi stays null
            vacuum: createLiquidityVacuum() // never updated — detect() returns false
        };

        const strategy = createOpeningMomentum(broker, eventBus);

        wireEngine(eventBus, state, indicators, [strategy], riskEngine);

        // Replay candles — emits 'tick' events that drive wireEngine
        replayCandles(symbol, candles, context, eventBus, broker);

        await sleep(INTER_SYMBOL_DELAY_MS);
    }

    return broker.getTradeHistory();
}

module.exports = { runBacktest };
