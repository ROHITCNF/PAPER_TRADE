function createOpeningMomentum(broker, eventBus) {

    function onTick(state) {
        // ⛔ ENTRY TIME GATE
        if (!isWithinEntryTime(state.time)) {
            return;
        }

        // ⛔ OPTIONAL SAFETY: no re-entry if already in position
        if (state.hasPosition) {
            return;
        }
        // ENTRY CONDITIONS ONLY
        if (
            state.ltp > state.vwap &&
            state.obi > 0.5
        ) {
            const qty = 1;

            // 1️⃣ Execute entry
            broker.buy(state.symbol, state.ltp, qty);

            // 2️⃣ Hand off to Risk Engine
            eventBus.emit("entry", {
                symbol: state.symbol,
                side: "LONG",
                entryPrice: state.ltp,
                qty,
                context: state.context, // must include adrPercent
                entryTime: state.time
            });
        }
    }
    function isWithinEntryTime(epochTime) {
        const d = new Date(epochTime * 1000); // epoch seconds → ms
        const hh = d.getHours();
        const mm = d.getMinutes();

        const minutes = hh * 60 + mm;

        const START = 9 * 60 + 30;   // 09:30
        const END = 14 * 60 + 30;  // 14:30

        return minutes >= START && minutes <= END;
    }

    return { onTick };
}

module.exports = { createOpeningMomentum };
