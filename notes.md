# 📈 AI-Powered Paper Trading Platform

A Node.js + Fyers SDK project for **simulated stock/options trading** with **AI feedback & strategy backtesting**.  
You can place trades with dummy money, test strategies on historical data, and get AI-driven insights like a personal trading coach.  

---

## 🏗️ Step-by-Step Roadmap

### Phase 1: Core Setup
- [ ] **Repo Setup**
  - Initialize Node.js project (`npm init`, TypeScript optional).
  - Add `.env` for Fyers credentials + AI API key.
  - Set up basic Express/Next.js backend with a health route.
  - (Optional) GitHub workflows for lint/test CI.

- [ ] **Fyers SDK Integration**
  - Write a simple service to connect to Fyers SDK.
  - Fetch account profile + one stock’s live price (`console.log` output).
  - Add service to fetch historical OHLC for a symbol.

---

### Phase 2: Paper Trading Engine
- [ ] **Dummy Wallet**
  - In-memory store (later DB) for:
    - Cash balance (e.g., ₹1,00,000).
    - Open positions.
    - Trade history.

- [ ] **Trade Execution**
  - Endpoints:
    - `POST /trade/buy`
    - `POST /trade/sell`
  - Deduct/credit balance, update positions.
  - Store each trade in history.

- [ ] **PNL Calculation**
  - Mark-to-market (MTM) updates using live prices.
  - Add `/portfolio` endpoint → returns positions, balance, PNL.

---

### Phase 3: Backtesting Layer
- [ ] **Strategy Input**
  - Accept a simple rule: e.g. _Buy NIFTY if RSI < 30_.
  - Start with MA crossover or RSI check.

- [ ] **Historical Replay**
  - Run backtest over past OHLC data (via Fyers).
  - Apply dummy trades → output PNL report.

---

### Phase 4: AI Integration
- [ ] **AI Service Layer**
  - Create `aiService.js`.
  - Integrate Gemini/OpenAI API.
  - Helper: `analyzeTrade(tradeContext)` → returns feedback.

- [ ] **AI in Trading Flow**
  - On trade execution → send context to AI → log/display feedback.
  - New endpoint: `/trade/analyze`.

- [ ] **Session Summary**
  - Aggregate stats: win rate, avg hold, risk:reward.
  - Send to AI → generate narrative session report.

---

### Phase 5: Frontend (React/Next.js)
- [ ] **Basic UI**
  - Page 1: Trade form (symbol, qty, price).
  - Page 2: Portfolio (balance, positions, PNL).

- [ ] **AI Feedback Panel**
  - After each trade → show AI coach’s feedback (chat bubble style).
  - Session summary at bottom.

---

### Phase 6: Polishing & Extra Features
- [ ] **Replay Mode (Education Layer)**
  - Select a past day → play candles step by step.
  - AI generates commentary per step.

- [ ] **Persistence**
  - Add DB (SQLite/Postgres) for trades, users, sessions.

- [ ] **Optional Open-Source/NPM Package**
  - Extract `aiService.js` + `tradeSimulator.js`.
  - Publish as reusable npm package.

---

## 🚀 Final Deliverable
- A full-stack **AI-powered trading simulator**.
- Realtime + historical data from Fyers SDK.
- AI insights integrated with your trades.
- Open-source project you can showcase in your resume.
