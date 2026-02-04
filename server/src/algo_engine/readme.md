Market Data (ticks / depth / candles)
        ↓
     EventBus  (dispatches events)
        ↓
   MarketState (current snapshot)
        ↓
   Indicators (VWAP, OBI, etc.)
        ↓
   Strategy (decision logic)
        ↓
   Broker (paper / live)
