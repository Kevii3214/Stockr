// Continuous fundamentals updater — calls the Supabase Edge Function to refresh
// all 30 DJIA stock fundamentals (P/E, EPS, Beta, Market Cap, etc.) from Finnhub
// and upsert them into the stock_fundamentals table.
//
// Usage:
//   node update-fundamentals-runner.js             # run once then loop every 4 hours
//   node update-fundamentals-runner.js --once      # run once and exit
//   INTERVAL_HOURS=6 node update-fundamentals-runner.js
//
// The edge function (supabase/functions/update-fundamentals) must have these
// Supabase secrets set:
//   supabase secrets set FINNHUB_API_KEY=<your_key>
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>

const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

// Load .env
const envPath = path.join(__dirname, '.env');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  });
}

const SUPABASE_URL  = env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const FINNHUB_KEY   = env.EXPO_PUBLIC_FINNHUB_API_KEY ?? '';

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/update-fundamentals`;

const INTERVAL_HOURS = parseFloat(process.env.INTERVAL_HOURS ?? '4');
const INTERVAL_MS    = INTERVAL_HOURS * 60 * 60 * 1000;
const RUN_ONCE       = process.argv.includes('--once');

// All 30 DJIA tickers (used for direct fallback if edge function fails)
const DJIA_TICKERS = [
  'AAPL','AMGN','AMZN','AXP','BA','CAT','CRM','CSCO','CVX','DIS',
  'DOW','GS','HD','HON','IBM','JNJ','JPM','KO','MCD','MMM',
  'MRK','MSFT','NKE','NVDA','PG','SHW','TRV','UNH','V','WMT',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Edge function path (preferred) ──────────────────────────────────────────

async function runViaEdgeFunction() {
  const res = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(`Edge function HTTP ${res.status}: ${JSON.stringify(body)}`);
  }
  if (body.error) {
    throw new Error(`Edge function error: ${body.error}`);
  }

  return { updated: body.updated ?? 0, errors: body.errors ?? [] };
}

// ─── Direct Node.js fallback (if edge function secrets not set) ───────────────
// Fetches Finnhub fundamentals directly and upserts via service_role key.
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.

function toNum(v) {
  if (typeof v === 'number' && isFinite(v)) return v;
  return null;
}

async function fetchMetricsDirect(ticker) {
  const url = `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const m = json?.metric ?? {};
  return {
    ticker,
    week_high_52:   toNum(m['52WeekHigh']),
    week_low_52:    toNum(m['52WeekLow']),
    pe_ratio:       toNum(m['peNormalizedAnnual']),
    market_cap:     toNum(m['marketCapitalization']),
    eps:            toNum(m['epsNormalizedAnnual']),
    beta:           toNum(m['beta']),
    dividend_yield: toNum(m['dividendYieldIndicatedAnnual']),
    avg_volume_10d: toNum(m['10DayAverageTradingVolume']),
    updated_at:     new Date().toISOString(),
  };
}

async function runDirect(serviceRoleKey) {
  const rows = [];
  const failed = [];
  const BATCH = 15;

  for (let i = 0; i < DJIA_TICKERS.length; i += BATCH) {
    const batch = DJIA_TICKERS.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(fetchMetricsDirect));
    results.forEach((r, idx) => {
      if (r) rows.push(r);
      else failed.push(batch[idx]);
    });
    if (i + BATCH < DJIA_TICKERS.length) await sleep(1100);
  }

  if (rows.length === 0) {
    throw new Error('Finnhub returned no data — check EXPO_PUBLIC_FINNHUB_API_KEY');
  }

  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/stock_fundamentals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });

  if (!upsertRes.ok) {
    const text = await upsertRes.text();
    throw new Error(`Supabase upsert failed (${upsertRes.status}): ${text}`);
  }

  return { updated: rows.length, errors: failed };
}

// ─── Single update run ────────────────────────────────────────────────────────

async function runOnce() {
  const start = Date.now();
  process.stdout.write(`[${timestamp()}]  Updating fundamentals... `);

  try {
    // Try edge function first
    const result = await runViaEdgeFunction();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✅  ${result.updated}/30 tickers updated  (${elapsed}s)`);
    if (result.errors.length > 0) {
      console.log(`    ⚠️  Failed tickers: ${result.errors.join(', ')}`);
    }
    return true;
  } catch (edgeErr) {
    const msg = edgeErr.message;

    // If secrets not configured, try direct mode
    if (msg.includes('FINNHUB_API_KEY secret not set') || msg.includes('service_role')) {
      const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        console.log('❌');
        console.log(`\n  Edge function error: ${msg}`);
        console.log('  Fix option A (recommended): set Supabase secrets:');
        console.log('    npx supabase secrets set FINNHUB_API_KEY=<your_key>');
        console.log('    npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>');
        console.log('  Fix option B: add SUPABASE_SERVICE_ROLE_KEY=<key> to your .env file\n');
        return false;
      }

      try {
        const result = await runDirect(serviceRoleKey);
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`✅  ${result.updated}/30 via direct API  (${elapsed}s)`);
        if (result.errors.length > 0) {
          console.log(`    ⚠️  Failed tickers: ${result.errors.join(', ')}`);
        }
        return true;
      } catch (directErr) {
        console.log('❌');
        console.log(`  Direct API error: ${directErr.message}\n`);
        return false;
      }
    }

    console.log('❌');
    console.log(`  Error: ${msg}\n`);
    return false;
  }
}

// ─── Main loop ────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error('❌  EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
  }
  if (!FINNHUB_KEY) {
    console.error('❌  EXPO_PUBLIC_FINNHUB_API_KEY must be set in .env');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('  Stockr  —  Fundamentals Updater');
  console.log(`  Supabase  : ${SUPABASE_URL}`);
  console.log(`  Tickers   : ${DJIA_TICKERS.length} DJIA stocks`);
  if (!RUN_ONCE) {
    console.log(`  Interval  : every ${INTERVAL_HOURS}h  (stop with Ctrl+C)`);
  }
  console.log('═══════════════════════════════════════════════════\n');

  // First run immediately
  await runOnce();

  if (RUN_ONCE) {
    process.exit(0);
  }

  // Then loop
  while (true) {
    const nextRun = new Date(Date.now() + INTERVAL_MS);
    console.log(`    Next update: ${nextRun.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`);
    await sleep(INTERVAL_MS);
    await runOnce();
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nStopped.');
  process.exit(0);
});

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
