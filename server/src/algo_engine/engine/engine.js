function wireEngine(eventBus, state, indicators, strategy, riskEngine) {

    // 🔹 PRICE / TICK HANDLER
    eventBus.on("tick", (t) => {
        state.ltp = t.price;
        state.volume = t.qty;
        state.time = t.time;
        state.dayVolume = t.volume;
        // 🔹 update daily structure
        if (t.dayStats) {
            state.dayStats = t.dayStats;
        }

        state.vwap = indicators.vwap.updateFromTick(
            t.price,
            t.qty
        );

        // 1️⃣ ENTRY LOGIC (strategy decides)
        strategy.onTick(state);

        // 2️⃣ EXIT LOGIC (risk engine decides)
        riskEngine.onTick({
            symbol: state.symbol,
            ltp: t.price,
            time: t.time,
            broker: strategy.broker,
            eventBus        // 👈 pass eventBus
        });
    });

    // 🔹 DEPTH HANDLER
    eventBus.on("depth", (d) => {
        state.depth = d.depth;
        state.spread = d.spread;

        state.obi = indicators.obi.update(d.depth);
        indicators.vacuum.update(d.depth, d.spread);
    });

    // 🔹 ENTRY REGISTRATION
    eventBus.on("entry", (entry) => {
        state.hasPosition = true;
        riskEngine.registerPosition(entry);
    });

    // 🔹 EXIT REGISTRATION (THIS WAS MISSING)
    eventBus.on("exit", (exit) => {
        state.hasPosition = false;

        // optional logging
        console.log(
            `🚪 EXIT ${exit.symbol} | reason=${exit.reason}`
        );
    });
}

module.exports = { wireEngine };
