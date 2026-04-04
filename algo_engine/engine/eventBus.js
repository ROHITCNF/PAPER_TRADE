function createEventBus() {
    const listeners = {};

    function on(event, handler) {
        listeners[event] ||= [];
        listeners[event].push(handler);
    }

    function emit(event, payload) {
        if (!listeners[event]) return;
        for (const handler of listeners[event]) {
            handler(payload);
        }
    }

    return { on, emit };
}

module.exports = { createEventBus };
