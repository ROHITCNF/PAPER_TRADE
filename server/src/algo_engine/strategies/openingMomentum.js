const fs = require('fs');
const path = require('path');

function createOpeningMomentum(broker, eventBus) {

    function onTick(state) {

        // ⛔ time gate
        if (!isWithinEntryTime(state.time)) return;

        // ⛔ already in trade
        if (state.hasPosition) return;

        // ⛔ context missing
        if (!state.context) return;

        //Range Rejection
        if (!isGapAcceptable(state)) return;
        if (!isRangeAvailable(state)) return;

        // 1️⃣ ADR filter
        if (!isTradable(state.context)) return;

        // 2️⃣ RVOL filter
        if (!hasSufficientVolume(state)) return;

        // 3️⃣ Location filter
        if (!isNearPrevDayLevel(state)) return;

        // 4️⃣ FINAL TRIGGER (unchanged)
        if (
            state.ltp > state.dayStats.open &&
            state.ltp > state.vwap &&
            state.obi > 0.5
        ) {
            const qty = 1;

            broker.buy(state.symbol, state.ltp, qty);
            const date = new Date();
            const time = date.getTime();
            console.log(JSON.stringify({
                time,
                ltp: state.ltp,
                symbol: state.symbol,
                vwap: state.vwap,
                obi: state.obi,
                type: 'BUY'
            }));
            try {
                const dateStr = date.toISOString().split('T')[0];
                const fileName = `${dateStr}-orders.log`;

                const filePath = path.join(__dirname, '../../../', fileName);

                const logContent = JSON.stringify({
                    time,
                    ltp: state.ltp,
                    symbol: state.symbol,
                    vwap: state.vwap,
                    obi: state.obi,
                    type: 'BUY'
                }) + '\n';

                fs.appendFile(filePath, logContent, err => {
                    if (err) console.error("Failed to write to order log:", err);
                });

            } catch (err) {
                console.error("Failed to write to order log:", err);
            }


            eventBus.emit("entry", {
                symbol: state.symbol,
                side: "LONG",
                entryPrice: state.ltp,
                qty,
                context: state.context,
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
    function isTradable(context) {
        if (!context) return false;

        const { adrPercent } = context;

        // avoid dead stocks
        return adrPercent >= 0.012; // 1.2%
    }
    function isNearPrevDayLevel(state) {
        const { prevDay, adrPercent } = state.context;
        if (!prevDay) return false;

        const buffer = state.ltp * (adrPercent * 0.1); // 10% ADR band

        return (
            Math.abs(state.ltp - prevDay.high) <= buffer ||
            Math.abs(state.ltp - prevDay.low) <= buffer
        );
    }
    // Before 12 PM  Not checking the volume .
    function hasSufficientVolume(state) {
        const { avgDailyVolume } = state.context;
        const vol = state.dayVolume;
        if (!avgDailyVolume || !vol) return false;

        const d = new Date(state.time * 1000);
        const minutes = d.getHours() * 60 + d.getMinutes();

        // BEFORE 12 PM → skip volume filter
        if (minutes < 12 * 60) {
            return true;
        }

        // AFTER 12 PM → enforce volume
        return vol >= avgDailyVolume * 0.6;
    }


    function noonEpoch(epoch) {
        const d = new Date(epoch * 1000);
        d.setHours(12, 0, 0, 0);
        return d.getTime() / 1000;
    }

    function isGapAcceptable(state) {
        const { chp } = state.dayStats;
        const { adrPercent } = state.context;

        if (chp == null || !adrPercent) return false;

        const gapPercent = Math.abs(chp) / 100;

        // if gap already > 1.2× ADR → skip
        return gapPercent <= adrPercent * 1.2;
    }
    function isRangeAvailable(state) {
        const { high, low, prevClose } = state.dayStats;
        const { adrPercent } = state.context;

        if (!high || !low || !prevClose || !adrPercent) return false;

        const dayRange = high - low;
        const adrRange = adrPercent * prevClose;

        const used = dayRange / adrRange;

        // if more than 80% of normal range used → skip
        return used <= 0.8;
    }




    return { onTick, broker };
}

module.exports = { createOpeningMomentum };
