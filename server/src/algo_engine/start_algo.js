const { createEventBus } = require("./engine/eventBus");
const { createMarketState } = require("./state/marketState");
const { createVWAP } = require("./indicators/vwap");
const { createOBI } = require("./indicators/obi");
const { createLiquidityVacuum } = require("./signals/liquidityVacuum");
const { createOpeningMomentum } = require("./strategies/openingMomentum");
const { createPaperBroker } = require("./execution/paperBroker");
const { wireEngine } = require("./engine/engine");
const { normalizeDepth } = require("./utils/helper");
const { auth_token, access_token } = require('./utils/constant');
const { preloadAllSymbols } = require("./preload/historicalPreload");
const FyersSocket = require("fyers-api-v3").fyersDataSocket;
// const FyersTbTSocket = require("fyers-api-v3").fyersTbtSocket;

async function startAlgo(symbols = []) {
    try {
        // symbols = ["NSE:RELIANCE-EQ"];
        // console.log(symbols);
        const historicalContext = await preloadAllSymbols(symbols);
        console.log('Historical Data is Preloaded ✅');

        const engines = {};

        symbols.forEach(symbol => {
            const eventBus = createEventBus();
            const state = createMarketState(symbol);

            const vwap = createVWAP();
            const obi = createOBI();
            const vacuum = createLiquidityVacuum();

            const broker = createPaperBroker();
            const strategy = createOpeningMomentum(broker);

            wireEngine(eventBus, state, { vwap, obi, vacuum }, strategy);
            engines[symbol] = eventBus;
        });

        const authCode = auth_token;
        const accessToken = access_token;
        const auth = `${authCode}:${accessToken}`;
        const socket = new FyersSocket(auth, "./logs", false);

        socket.on("connect", () => {
            console.log("✅ Data Socket Connected");
            socket.subscribe(symbols, true);
            socket.subscribe(symbols);
            socket.autoreconnect();
        });

        socket.on("message", (data) => {
            if (!data || !data.type || !data.symbol) return;

            const engine = engines[data.symbol];
            if (!engine) return;

            if (data.type === "sf") {
                engine.emit("tick", {
                    price: data.ltp,
                    qty: data.last_traded_qty || 0,
                    time: data.last_traded_time || Date.now(),
                    volume: data.vol_traded_today
                });
            }

            if (data.type === "dp") {
                const depth = normalizeDepth(data);
                if (!depth) return;

                engine.emit("depth", {
                    depth,
                    spread: depth.spread
                });
            }
        });

        socket.on("error", (error) => console.error(`Data Socket Error: ${JSON.stringify(error)}`));
        socket.on("close", () => console.log("❌ Data Socket closed"));
        socket.connect();
    } catch (error) {
        console.log(error);
    }
}

module.exports = { startAlgo };
