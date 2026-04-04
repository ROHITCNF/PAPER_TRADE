// wireEngine connects all components for a single symbol via the eventBus.
//
// `strategies` is an ARRAY — add new strategies here without changing this file.
// Each strategy must implement: { id: string, onTick(state, signals), broker }
//
// Signals computed per tick/depth and passed to every strategy:
//   { vwap, obi, liquidityVacuum }
function wireEngine(eventBus, state, indicators, strategies, riskEngine) {

    // --- TICK ---
    eventBus.on('tick', (t) => {
        state.ltp      = t.price;
        state.volume   = t.qty;
        state.time     = t.time;
        state.dayVolume = t.volume;

        if (t.dayStats) {
            state.dayStats = t.dayStats;
        }

        state.vwap = indicators.vwap.updateFromTick(t.price, t.qty);

        const signals = {
            vwap: state.vwap,
            obi: state.obi,
            liquidityVacuum: indicators.vacuum.detect()
        };

        // Call every strategy with the same state snapshot + signals
        for (const strategy of strategies) {
            strategy.onTick(state, signals);
        }

        // Risk engine evaluates exits for all open positions on this symbol
        riskEngine.onTick({
            symbol: state.symbol,
            ltp: t.price,
            time: t.time,
            broker: strategies[0].broker, // broker is shared per symbol
            eventBus
        });
    });

    // --- DEPTH ---
    eventBus.on('depth', (d) => {
        state.depth  = d.depth;
        state.spread = d.spread;

        state.obi = indicators.obi.update(d.depth);
        indicators.vacuum.update(d.depth);
    });

    // --- ENTRY (emitted by a strategy) ---
    eventBus.on('entry', (entry) => {
        state.positions[entry.strategyId] = true;
        riskEngine.registerPosition(entry);
    });

    // --- EXIT (emitted by riskEngine) ---
    eventBus.on('exit', (exit) => {
        delete state.positions[exit.strategyId];
        console.log(`EXIT ${exit.symbol} | strategy=${exit.strategyId} | reason=${exit.reason}`);
    });
}

module.exports = { wireEngine };
