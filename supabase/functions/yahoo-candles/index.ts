// Supabase Edge Function: yahoo-candles
// Proxies Yahoo Finance chart data to avoid CORS restrictions in browser.
// GET /functions/v1/yahoo-candles?ticker=AAPL
// Returns: { closes: number[] }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(req.url);
  const ticker = url.searchParams.get('ticker');

  if (!ticker || !/^[A-Z]{1,5}$/.test(ticker)) {
    return new Response(JSON.stringify({ error: 'invalid ticker' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    // range=5d ensures we always get the most recent full trading day even on weekends/holidays
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=5m&range=5d`;
    const res = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `yahoo status ${res.status}` }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];

    if (!result) {
      return new Response(JSON.stringify({ closes: [] }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const timestamps: number[] = result.timestamp ?? [];
    const allCloses: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    // Find the last trading day's data: group by calendar date, pick the last date that has data
    if (timestamps.length === 0) {
      return new Response(JSON.stringify({ closes: [] }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Build date string for each timestamp (Eastern time, where NYSE operates)
    // Use simple UTC-5 offset (EST) — close enough since we just want date grouping
    const dateOf = (ts: number) => {
      const d = new Date((ts - 5 * 3600) * 1000);
      return d.toISOString().slice(0, 10);
    };

    // Collect all dates that have at least one non-null close
    const dateSet = new Set<string>();
    for (let i = 0; i < timestamps.length; i++) {
      if (allCloses[i] !== null && isFinite(allCloses[i] as number)) {
        dateSet.add(dateOf(timestamps[i]));
      }
    }

    const sortedDates = Array.from(dateSet).sort();
    const lastDate = sortedDates[sortedDates.length - 1];

    // Filter closes to just the last trading day
    const closes: number[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (dateOf(timestamps[i]) === lastDate && allCloses[i] !== null && isFinite(allCloses[i] as number)) {
        closes.push(allCloses[i] as number);
      }
    }

    return new Response(JSON.stringify({ closes }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
