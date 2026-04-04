const FyersSocket = require('fyers-api-v3').fyersDataSocket;
const { equityStocks } = require('../utils/constant');
const { normalizeDepth } = require('../utils/helper');
const { preloadAllSymbols } = require('../preload/historicalPreload');

const { createEventBus }        = require('./eventBus');
const { wireEngine }            = require('./engine');
const { createMarketState }     = require('../state/marketState');
const { createVWAP }            = require('../indicators/vwap');
const { createOBI }             = require('../indicators/obi');
const { createLiquidityVacuum } = require('../signals/liquidityVacuum');
const { createPaperBroker }     = require('../execution/paperBroker');
const { createRiskEngine }      = require('../risk/riskEngine');
const { createOpeningMomentum } = require('../strategies/openingMomentum');

async function start(symbols = equityStocks) {
    console.log(`Starting algo engine for ${symbols.length} symbols...`);

    const historicalContext = await preloadAllSymbols(symbols);
    console.log('Historical data preloaded');

    const engines    = {};
    const broker     = createPaperBroker();   // shared across all symbols
    const riskEngine = createRiskEngine({});  // shared across all symbols

    for (const symbol of symbols) {
        const eventBus = createEventBus();
        const state    = createMarketState(symbol, historicalContext[symbol]);

        const indicators = {
            vwap:   createVWAP(),
            obi:    createOBI(),
            vacuum: createLiquidityVacuum()
        };

        // ── Add strategies here to run multiple on the same symbol ──────────
        const strategies = [
            createOpeningMomentum(broker, eventBus)
            // createAnotherStrategy(broker, eventBus),
        ];
        // ───────────────────────────────────────────────────────────────────

        wireEngine(eventBus, state, indicators, strategies, riskEngine);

        engines[symbol] = eventBus;
    }

    // Tokens are read at call-time from process.env so freshly generated values are used
    const auth   = `${process.env.AUTH_TOKEN}:${process.env.ACCESS_TOKEN}`;
    const socket = new FyersSocket(auth, './logs', false);

    socket.on('connect', () => {
        console.log('Fyers socket connected');
        socket.subscribe(symbols, true); // depth
        socket.subscribe(symbols);       // ticks
        socket.autoreconnect();
    });

    socket.on('message', (data) => {
        if (!data?.type || !data?.symbol) return;
        console.log(data);
        const engine = engines[data.symbol];
        if (!engine) return;

        if (data.type === 'sf') {
            engine.emit('tick', {
                price:  data.ltp,
                qty:    data.last_traded_qty  || 0,
                time:   data.last_traded_time || Math.floor(Date.now() / 1000),
                volume: data.vol_traded_today,
                dayStats: {
                    open:      data.open_price,
                    high:      data.high_price,
                    low:       data.low_price,
                    prevClose: data.prev_close_price,
                    chp:       data.chp,
                    upperCkt:  data.upper_ckt,
                    lowerCkt:  data.lower_ckt
                }
            });
        }

        if (data.type === 'dp') {
            const depth = normalizeDepth(data);
            if (!depth) return;
            engine.emit('depth', { depth, spread: depth.spread });
        }
    });

    socket.on('error', (err) => console.error('Socket error:', JSON.stringify(err)));
    socket.on('close', ()    => console.log('Socket closed'));

    socket.connect();
}

module.exports = { start };
