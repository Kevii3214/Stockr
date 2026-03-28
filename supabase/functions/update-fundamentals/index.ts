// Supabase Edge Function: update-fundamentals
// Fetches fundamental metrics from Finnhub for all 30 DJIA stocks and upserts into stock_fundamentals.
// POST /functions/v1/update-fundamentals
// Requires Authorization: Bearer <service_role_key>
// Returns: { updated: number, errors: string[] }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FINNHUB_KEY = Deno.env.get('FINNHUB_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const DJIA_TICKERS = [
  'AAPL', 'AMGN', 'AMZN', 'AXP',  'BA',   'CAT',  'CRM',  'CSCO', 'CVX',  'DIS',
  'DOW',  'GS',   'HD',   'HON',  'IBM',  'JNJ',  'JPM',  'KO',   'MCD',  'MMM',
  'MRK',  'MSFT', 'NKE',  'NVDA', 'PG',   'SHW',  'TRV',  'UNH',  'V',    'WMT',
];

interface FundamentalsRow {
  ticker: string;
  week_high_52: number | null;
  week_low_52: number | null;
  pe_ratio: number | null;
  market_cap: number | null;
  eps: number | null;
  beta: number | null;
  dividend_yield: number | null;
  avg_volume_10d: number | null;
  updated_at: string;
}

function toNum(v: unknown): number | null {
  if (typeof v === 'number' && isFinite(v)) return v;
  return null;
}

async function fetchMetrics(ticker: string): Promise<FundamentalsRow | null> {
  try {
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
  } catch {
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  if (!FINNHUB_KEY) {
    return new Response(JSON.stringify({ error: 'FINNHUB_API_KEY secret not set' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const rows: FundamentalsRow[] = [];
  const errors: string[] = [];
  const BATCH_SIZE = 15;

  for (let i = 0; i < DJIA_TICKERS.length; i += BATCH_SIZE) {
    const batch = DJIA_TICKERS.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(fetchMetrics));
    for (let j = 0; j < batch.length; j++) {
      if (results[j]) {
        rows.push(results[j] as FundamentalsRow);
      } else {
        errors.push(batch[j]);
      }
    }
    if (i + BATCH_SIZE < DJIA_TICKERS.length) {
      await sleep(1100);
    }
  }

  if (rows.length > 0) {
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/stock_fundamentals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(rows),
    });

    if (!upsertRes.ok) {
      const body = await upsertRes.text();
      return new Response(JSON.stringify({ error: `Supabase upsert failed: ${body}` }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ updated: rows.length, errors }), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
