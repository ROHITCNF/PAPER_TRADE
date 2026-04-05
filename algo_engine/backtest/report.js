const puppeteer = require('puppeteer');
const path      = require('path');
const fs        = require('fs');

// ── Helpers ───────────────────────────────────────────────────────────────────

// Converts "NSE:RELIANCE-EQ" → "RELIANCE" for use as a filename
function _cleanSymbol(symbol) {
    return symbol.replace(/^[^:]+:/, '').replace(/-EQ$/, '');
}

function _fmtPnl(v) {
    return `${v >= 0 ? '+' : ''}₹${v.toFixed(2)}`;
}

function _fmtDate(epochSeconds) {
    if (!epochSeconds) return '—';
    return new Date(epochSeconds * 1000).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
    });
}

// ── Per-symbol stats ──────────────────────────────────────────────────────────

function _calcSymbolStats(trades) {
    const winners = trades.filter(t => t.pnl > 0);
    const losers  = trades.filter(t => t.pnl <= 0);
    const longs   = trades.filter(t => t.side === 'LONG');
    const shorts  = trades.filter(t => t.side === 'SHORT');

    const totalPnL   = trades.reduce((s, t) => s + t.pnl, 0);
    const avgWin     = winners.length ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
    const avgLoss    = losers.length  ? losers.reduce((s, t)  => s + t.pnl, 0) / losers.length  : 0;
    const winRate    = trades.length  ? (winners.length / trades.length) * 100 : 0;

    let peak = 0, maxDrawdown = 0, cumPnL = 0;
    for (const t of trades) {
        cumPnL += t.pnl;
        if (cumPnL > peak) peak = cumPnL;
        const dd = peak - cumPnL;
        if (dd > maxDrawdown) maxDrawdown = dd;
    }

    return {
        total: trades.length, winners: winners.length, losers: losers.length,
        longs: longs.length,  shorts: shorts.length,
        totalPnL, avgWin, avgLoss, winRate, maxDrawdown
    };
}

// ── Summary stats (all symbols) ───────────────────────────────────────────────

function _calcSummaryStats(trades) {
    const stats = _calcSymbolStats(trades);

    const expectancy = trades.length
        ? (stats.avgWin  * (stats.winners / trades.length))
        + (stats.avgLoss * (stats.losers  / trades.length))
        : 0;

    const longs  = trades.filter(t => t.side === 'LONG');
    const shorts = trades.filter(t => t.side === 'SHORT');
    const longWR  = longs.length  ? ((longs.filter(t  => t.pnl > 0).length / longs.length)  * 100).toFixed(1) : 'N/A';
    const shortWR = shorts.length ? ((shorts.filter(t => t.pnl > 0).length / shorts.length) * 100).toFixed(1) : 'N/A';

    const bySymbol = {};
    for (const t of trades) {
        if (!bySymbol[t.symbol]) bySymbol[t.symbol] = { trades: 0, pnl: 0, wins: 0 };
        bySymbol[t.symbol].trades++;
        bySymbol[t.symbol].pnl  += t.pnl;
        if (t.pnl > 0) bySymbol[t.symbol].wins++;
    }
    for (const s of Object.values(bySymbol)) {
        s.pnl     = parseFloat(s.pnl.toFixed(2));
        s.winRate = ((s.wins / s.trades) * 100).toFixed(1);
    }
    const symbolRows = Object.entries(bySymbol).sort((a, b) => b[1].pnl - a[1].pnl);

    return { ...stats, expectancy, longWR, shortWR, symbolRows };
}

// ── Shared CSS ────────────────────────────────────────────────────────────────

const BASE_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', sans-serif; background: #f4f6f9; color: #222; padding: 28px; }
h1 { font-size: 20px; color: #1a1a2e; margin-bottom: 4px; }
.subtitle { font-size: 12px; color: #777; margin-bottom: 24px; }
.grid { display: grid; gap: 14px; margin-bottom: 22px; }
.grid-4 { grid-template-columns: repeat(4, 1fr); }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.card { background: #fff; border-radius: 10px; padding: 16px 18px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
.card .label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
.card .value { font-size: 20px; font-weight: 700; }
.pos { color: #16a34a; } .neg { color: #dc2626; } .neu { color: #1a1a2e; }
.section { background: #fff; border-radius: 10px; padding: 18px 22px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); margin-bottom: 20px; }
.section h2 { font-size: 13px; font-weight: 600; color: #555; margin-bottom: 14px; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th { text-align: left; padding: 7px 10px; background: #f8f9fb; color: #555; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
td { padding: 7px 10px; border-bottom: 1px solid #f3f3f3; }
tr.pos-row td.pnl { color: #16a34a; font-weight: 600; }
tr.neg-row td.pnl { color: #dc2626; font-weight: 600; }
.badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.badge-long  { background: #dcfce7; color: #16a34a; }
.badge-short { background: #fee2e2; color: #dc2626; }
`;

// ── Per-symbol HTML ───────────────────────────────────────────────────────────

function _buildSymbolHTML(symbol, trades, s, fromDate, toDate) {
    const tradeRows = trades.map((t, i) => `
        <tr class="${t.pnl >= 0 ? 'pos-row' : 'neg-row'}">
            <td>${i + 1}</td>
            <td>${_fmtDate(t.entryTime)}</td>
            <td>${_fmtDate(t.exitTime)}</td>
            <td><span class="badge badge-${t.side.toLowerCase()}">${t.side}</span></td>
            <td>₹${t.entryPrice.toFixed(2)}</td>
            <td>₹${t.exitPrice.toFixed(2)}</td>
            <td>${t.qty}</td>
            <td class="pnl">${_fmtPnl(t.pnl)}</td>
            <td>${t.reason || '—'}</td>
        </tr>`).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
${BASE_CSS}
</style></head><body>
  <h1>${_cleanSymbol(symbol)}</h1>
  <p class="subtitle">${symbol} &nbsp;|&nbsp; ${fromDate} → ${toDate} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-IN')}</p>

  <div class="grid grid-4">
    <div class="card"><div class="label">Total Trades</div><div class="value neu">${s.total}</div></div>
    <div class="card"><div class="label">Win Rate</div><div class="value ${s.winRate >= 50 ? 'pos' : 'neg'}">${s.winRate.toFixed(1)}%</div></div>
    <div class="card"><div class="label">Total PnL</div><div class="value ${s.totalPnL >= 0 ? 'pos' : 'neg'}">₹${s.totalPnL.toFixed(2)}</div></div>
    <div class="card"><div class="label">Max Drawdown</div><div class="value neg">₹${s.maxDrawdown.toFixed(2)}</div></div>
  </div>
  <div class="grid grid-4">
    <div class="card"><div class="label">Avg Win</div><div class="value pos">₹${s.avgWin.toFixed(2)}</div></div>
    <div class="card"><div class="label">Avg Loss</div><div class="value neg">₹${s.avgLoss.toFixed(2)}</div></div>
    <div class="card"><div class="label">LONG Trades</div><div class="value neu">${s.longs}</div></div>
    <div class="card"><div class="label">SHORT Trades</div><div class="value neu">${s.shorts}</div></div>
  </div>

  <div class="section">
    <h2>All Trades (${trades.length})</h2>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Entry Time</th><th>Exit Time</th><th>Side</th>
          <th>Entry ₹</th><th>Exit ₹</th><th>Qty</th><th>PnL</th><th>Reason</th>
        </tr>
      </thead>
      <tbody>${tradeRows}</tbody>
    </table>
  </div>
</body></html>`;
}

// ── Summary HTML ──────────────────────────────────────────────────────────────

function _buildSummaryHTML(s, fromDate, toDate) {
    const symbolRows = s.symbolRows.map(([sym, d]) => `
        <tr class="${d.pnl >= 0 ? 'pos-row' : 'neg-row'}">
            <td>${_cleanSymbol(sym)}</td>
            <td>${d.trades}</td>
            <td>${d.winRate}%</td>
            <td class="pnl">${_fmtPnl(d.pnl)}</td>
        </tr>`).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
${BASE_CSS}
</style></head><body>
  <h1>Backtest Summary — Opening Momentum Strategy</h1>
  <p class="subtitle">${fromDate} → ${toDate} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-IN')}</p>

  <div class="grid grid-4">
    <div class="card"><div class="label">Total Trades</div><div class="value neu">${s.total}</div></div>
    <div class="card"><div class="label">Win Rate</div><div class="value ${s.winRate >= 50 ? 'pos' : 'neg'}">${s.winRate.toFixed(1)}%</div></div>
    <div class="card"><div class="label">Total PnL</div><div class="value ${s.totalPnL >= 0 ? 'pos' : 'neg'}">₹${s.totalPnL.toFixed(2)}</div></div>
    <div class="card"><div class="label">Expectancy</div><div class="value ${s.expectancy >= 0 ? 'pos' : 'neg'}">₹${s.expectancy.toFixed(2)}</div></div>
    <div class="card"><div class="label">Avg Win</div><div class="value pos">₹${s.avgWin.toFixed(2)}</div></div>
    <div class="card"><div class="label">Avg Loss</div><div class="value neg">₹${s.avgLoss.toFixed(2)}</div></div>
    <div class="card"><div class="label">Max Drawdown</div><div class="value neg">₹${s.maxDrawdown.toFixed(2)}</div></div>
    <div class="card"><div class="label">W / L</div><div class="value neu">${s.winners}W &nbsp; ${s.losers}L</div></div>
  </div>

  <div class="grid grid-2">
    <div class="card">
      <div class="label">LONG Trades</div>
      <div class="value neu">${s.longs} &nbsp;<span style="font-size:13px;color:#888">Win rate: ${s.longWR}%</span></div>
    </div>
    <div class="card">
      <div class="label">SHORT Trades</div>
      <div class="value neu">${s.shorts} &nbsp;<span style="font-size:13px;color:#888">Win rate: ${s.shortWR}%</span></div>
    </div>
  </div>

  <div class="section">
    <h2>All Symbols — PnL Breakdown</h2>
    <table>
      <thead><tr><th>Symbol</th><th>Trades</th><th>Win Rate</th><th>PnL</th></tr></thead>
      <tbody>${symbolRows}</tbody>
    </table>
  </div>
</body></html>`;
}

// ── PDF generation ────────────────────────────────────────────────────────────

async function generateReport(trades, fromDate, toDate) {
    if (trades.length === 0) {
        console.log('\nNo trades taken in this backtest period.\n');
        return;
    }

    // Group trades by symbol
    const bySymbol = {};
    for (const t of trades) {
        if (!bySymbol[t.symbol]) bySymbol[t.symbol] = [];
        bySymbol[t.symbol].push(t);
    }

    // Output folder: algo_engine/reports/2025-01-01_2025-03-31/
    const reportsDir = path.join(__dirname, '../reports', `${fromDate}_${toDate}`);
    fs.mkdirSync(reportsDir, { recursive: true });

    // Console summary
    const summary = _calcSummaryStats(trades);
    console.log('\n' + '='.repeat(52));
    console.log(' BACKTEST REPORT');
    console.log('='.repeat(52));
    console.log(`Total trades   : ${summary.total}  (${summary.longs} LONG, ${summary.shorts} SHORT)`);
    console.log(`Win rate       : ${summary.winRate.toFixed(1)}%  (${summary.winners}W / ${summary.losers}L)`);
    console.log(`Total PnL      : ₹${summary.totalPnL.toFixed(2)}`);
    console.log(`Avg win        : ₹${summary.avgWin.toFixed(2)}   Avg loss: ₹${summary.avgLoss.toFixed(2)}`);
    console.log(`Expectancy     : ₹${summary.expectancy.toFixed(2)} per trade`);
    console.log(`Max drawdown   : ₹${summary.maxDrawdown.toFixed(2)}`);
    console.log(`LONG  win rate : ${summary.longWR}%`);
    console.log(`SHORT win rate : ${summary.shortWR}%`);
    console.log('='.repeat(52));
    console.log(`\nGenerating ${Object.keys(bySymbol).length + 1} PDFs → ${reportsDir}`);

    // Launch browser once and reuse across all PDFs
    const browser = await puppeteer.launch({ headless: true });
    const page    = await browser.newPage();

    const pdfOptions = {
        format: 'A4',
        margin: { top: '16px', bottom: '16px', left: '16px', right: '16px' },
        printBackground: true
    };

    // Per-symbol PDFs
    for (const [symbol, symbolTrades] of Object.entries(bySymbol)) {
        const stats    = _calcSymbolStats(symbolTrades);
        const html     = _buildSymbolHTML(symbol, symbolTrades, stats, fromDate, toDate);
        const fileName = `${_cleanSymbol(symbol)}.pdf`;

        await page.setContent(html, { waitUntil: 'domcontentloaded' });
        await page.pdf({ ...pdfOptions, path: path.join(reportsDir, fileName) });
        process.stdout.write(`  ✓ ${fileName}\n`);
    }

    // Summary PDF
    const summaryHtml = _buildSummaryHTML(summary, fromDate, toDate);
    await page.setContent(summaryHtml, { waitUntil: 'domcontentloaded' });
    await page.pdf({ ...pdfOptions, path: path.join(reportsDir, '_summary.pdf') });
    console.log('  ✓ _summary.pdf');

    await browser.close();
    console.log(`\nAll PDFs saved to: ${reportsDir}\n`);
}

module.exports = { generateReport };
