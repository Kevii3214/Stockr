// Playwright test: verify the stock info modal loads real data for each DJIA stock
// Run with: node playwright-test.js
// Reads credentials from .env automatically, or override with TEST_EMAIL / TEST_PASSWORD
// Options:
//   STOCKS_TO_CHECK=10 node playwright-test.js   (default: 5)
//   HEADLESS=false node playwright-test.js        (show browser window)

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const APP_URL         = 'http://localhost:8081';
const TIMEOUT         = 45_000;
const STOCKS_TO_CHECK = parseInt(process.env.STOCKS_TO_CHECK ?? '5', 10);
const HEADLESS        = process.env.HEADLESS !== 'false';

// Load .env
const envPath = path.join(__dirname, '.env');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  });
}

const SUPABASE_URL  = env.EXPO_PUBLIC_SUPABASE_URL  || '';
const SUPABASE_ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const TEST_EMAIL    = process.env.TEST_EMAIL    || `pwtest${Date.now()}@gmail.com`;
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPass123!';

const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)\./)?.[1] ?? '';
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

// Labels the info modal must show (matches StockCard.tsx InfoRow labels)
const REQUIRED_LABELS = [
  'Price Action',
  "Today's Range",
  '52-Week Range',
  'Open',
  'Prev. Close',
  'Valuation',
  'Market Cap',
  'P/E Ratio',
  'EPS',
  'Dividend Yield',
  'Risk & Activity',
  'Beta',
  'Avg. Volume (10d)',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function waitForServer(url, maxMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch { /* not ready */ }
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error(`Server not ready at ${url}`);
}

async function getSupabaseSession(email, password) {
  const signIn = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON },
    body: JSON.stringify({ email, password }),
  });
  const siData = await signIn.json();
  if (siData.access_token) {
    console.log('     ✅  Signed in via API');
    return siData;
  }
  const signUp = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON },
    body: JSON.stringify({ email, password }),
  });
  const suData = await signUp.json();
  if (suData.access_token) {
    console.log('     ✅  Signed up + logged in via API');
    return suData;
  }
  console.log('     ⚠️  API auth failed:', suData.msg || suData.error || JSON.stringify(suData));
  return null;
}

// Simulate a left swipe on the card deck to advance to the next stock
async function swipeCardLeft(page) {
  // Card is centered in 390×844 viewport; drag from right-center to off-screen left
  const startX = 280, startY = 430;
  const endX   = -60,  endY = 430;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let step = 1; step <= 20; step++) {
    await page.mouse.move(
      startX + ((endX - startX) * step) / 20,
      startY,
      { steps: 1 },
    );
    await new Promise(r => setTimeout(r, 12));
  }
  await page.mouse.up();
  await page.waitForTimeout(600);
}

// ─── Per-stock info check ─────────────────────────────────────────────────────

async function checkStockInfoModal(page, stockIndex) {
  const result = { ticker: '?', labelsFound: 0, labelsTotal: REQUIRED_LABELS.length, dashCount: 0, errors: [] };

  // Grab current ticker from the card (small purple ticker label)
  try {
    // The ticker is displayed as a short all-caps text like "AAPL" in purple
    const tickerEl = page.locator('text=/^[A-Z]{1,5}$/').first();
    await tickerEl.waitFor({ state: 'visible', timeout: 5000 });
    result.ticker = (await tickerEl.textContent())?.trim() ?? '?';
  } catch {
    result.ticker = `Stock #${stockIndex + 1}`;
  }

  // Wait for a price to confirm card is loaded
  try {
    await page.waitForSelector('text=/\\$\\d+\\.\\d{2}/', { timeout: 12_000 });
  } catch {
    result.errors.push('Price not loaded');
    return result;
  }

  // Click ⓘ button
  const infoBtn = page.locator('text=ⓘ').first();
  try {
    await infoBtn.waitFor({ state: 'visible', timeout: 6000 });
    await infoBtn.click();
    await page.waitForTimeout(500);
  } catch {
    result.errors.push('ⓘ button not found or not clickable');
    return result;
  }

  // Wait for modal to be visible — the close ✕ button appears in the modal header
  try {
    await page.waitForSelector('text=✕', { timeout: 5000 });
  } catch {
    result.errors.push('Modal did not open (✕ not found)');
    return result;
  }

  // Check required labels
  for (const label of REQUIRED_LABELS) {
    const ok = await page.isVisible(`text=${label}`, { timeout: 2000 }).catch(() => false);
    if (ok) result.labelsFound++;
  }

  // Count '—' placeholders (missing fundamentals data)
  result.dashCount = await page.locator('text=—').count();

  // Verify the modal is actually scrollable (scroll down and back up)
  try {
    await page.evaluate(() => {
      const scrollable = Array.from(document.querySelectorAll('*')).find(el => {
        const s = window.getComputedStyle(el);
        return (s.overflow === 'scroll' || s.overflowY === 'scroll' ||
                s.overflow === 'auto'   || s.overflowY === 'auto') &&
               el.scrollHeight > el.clientHeight + 10;
      });
      if (scrollable) scrollable.scrollTop = 300;
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const scrollable = Array.from(document.querySelectorAll('*')).find(el => {
        const s = window.getComputedStyle(el);
        return (s.overflow === 'scroll' || s.overflowY === 'scroll' ||
                s.overflow === 'auto'   || s.overflowY === 'auto') &&
               el.scrollHeight > el.clientHeight + 10;
      });
      if (scrollable) scrollable.scrollTop = 0;
    });
  } catch { /* ignore scroll errors */ }

  // Close modal
  const closeBtn = page.locator('text=✕').first();
  try {
    await closeBtn.click();
    await page.waitForTimeout(400);
  } catch {
    result.errors.push('Could not close modal');
  }

  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('⏳  Waiting for Expo web server at', APP_URL, '...');
  await waitForServer(APP_URL);
  console.log('✅  Server is up\n');

  // Auth
  console.log('🔑  [Auth] Getting session for', TEST_EMAIL, '...');
  const session = SUPABASE_URL ? await getSupabaseSession(TEST_EMAIL, TEST_PASSWORD) : null;

  const browser = await chromium.launch({ headless: HEADLESS });
  const ctx     = await browser.newContext({ viewport: { width: 390, height: 844 } });

  if (session?.access_token) {
    const payload = JSON.stringify({
      access_token:  session.access_token,
      refresh_token: session.refresh_token,
      expires_at:    session.expires_at,
      token_type:    'bearer',
      user:          session.user,
    });
    await ctx.addInitScript(({ key, value }) => {
      localStorage.setItem(key, value);
    }, { key: STORAGE_KEY, value: payload });
    console.log('     Session injected into localStorage\n');
  } else {
    console.log('     No session — UI login will be attempted if needed\n');
  }

  const page   = await ctx.newPage();
  const jsErrors = [];
  page.on('console', m => { if (m.type() === 'error') jsErrors.push(m.text()); });
  page.on('pageerror', e => jsErrors.push(e.message));

  try {
    // ── Load app ─────────────────────────────────────────────────────────────
    console.log('📱  Loading app...');
    await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'debug_pw_01_loaded.png' });

    // ── Handle login screen if session injection failed ───────────────────────
    const onLogin = await page.isVisible('text=Sign in to your account', { timeout: 3000 }).catch(() => false);
    if (onLogin) {
      if (!session) {
        console.log('⚠️  On login screen — set TEST_EMAIL / TEST_PASSWORD env vars and re-run');
        await browser.close();
        return;
      }
      console.log('ℹ️   Session injection ignored; trying UI login...');
      await page.evaluate(([email, password]) => {
        function fill(ph, val) {
          const el = Array.from(document.querySelectorAll(`input[placeholder="${ph}"]`))
            .find(e => e.getBoundingClientRect().width > 0);
          if (!el) throw new Error('Input not found: ' + ph);
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        fill('Email', email);
        fill('Password', password);
      }, [TEST_EMAIL, TEST_PASSWORD]);
      await page.getByText('Sign In').click();
      await page.waitForFunction(
        () => !document.body.innerText.includes('Sign in to your account'),
        { timeout: 12_000 }
      ).catch(() => {});
      await page.waitForTimeout(2000);
    }

    // ── Wait for first stock price ────────────────────────────────────────────
    console.log('📈  Waiting for first stock price to load...');
    try {
      await page.waitForSelector('text=/\\$\\d+\\.\\d{2}/', { timeout: TIMEOUT });
      console.log('     ✅  Stock data loaded\n');
    } catch {
      console.log('     ❌  Stock prices never appeared — check Finnhub API key and auth\n');
      await page.screenshot({ path: 'debug_pw_nodata.png' });
      await browser.close();
      return;
    }

    await page.screenshot({ path: 'debug_pw_02_stocks_loaded.png' });

    // ── Loop through stocks ───────────────────────────────────────────────────
    console.log(`🔍  Checking info modal for ${STOCKS_TO_CHECK} stocks...\n`);
    const stockResults = [];

    for (let i = 0; i < STOCKS_TO_CHECK; i++) {
      process.stdout.write(`  [${i + 1}/${STOCKS_TO_CHECK}] `);
      const result = await checkStockInfoModal(page, i);
      stockResults.push(result);

      const allLabels = result.labelsFound === result.labelsTotal;
      const noMissing = result.dashCount === 0;
      const statusIcon = allLabels && noMissing ? '✅' : result.errors.length ? '❌' : '⚠️ ';
      console.log(
        `${statusIcon} ${result.ticker.padEnd(5)} ` +
        `labels: ${result.labelsFound}/${result.labelsTotal}  ` +
        `missing: ${result.dashCount}  ` +
        (result.errors.length ? `errors: ${result.errors.join(', ')}` : '')
      );

      // Advance to next card (unless last one)
      if (i < STOCKS_TO_CHECK - 1) {
        await swipeCardLeft(page);
        // Brief wait for next card to settle
        await page.waitForTimeout(800);
      }
    }

    await page.screenshot({ path: 'debug_pw_final.png' });

    // ── Summary ───────────────────────────────────────────────────────────────
    const totalLabels   = stockResults.reduce((s, r) => s + r.labelsFound, 0);
    const maxLabels     = stockResults.length * REQUIRED_LABELS.length;
    const stocksAllData = stockResults.filter(r => r.dashCount === 0 && r.errors.length === 0).length;
    const stocksMissing = stockResults.filter(r => r.dashCount > 0).length;

    console.log(`\n${'─'.repeat(52)}`);
    console.log(`Stocks checked  : ${stockResults.length}`);
    console.log(`Labels visible  : ${totalLabels}/${maxLabels} (${Math.round(totalLabels / maxLabels * 100)}%)`);
    console.log(`Full data       : ${stocksAllData}/${stockResults.length} stocks`);
    if (stocksMissing > 0) {
      console.log(`Missing data    : ${stocksMissing} stock(s) have "—" placeholders`);
      console.log(`  → Run:  node update-fundamentals-runner.js   to populate the DB`);
    }
    console.log(`${'─'.repeat(52)}`);
    if (stocksAllData === stockResults.length) {
      console.log('🎉  All stocks have complete data!');
    }

  } finally {
    await browser.close();
  }

  if (jsErrors.length) {
    console.log('\n⚠️  JS errors during test:');
    jsErrors.slice(0, 10).forEach(e => console.log('  ', e));
  } else {
    console.log('\n✅  No JS console errors');
  }
  console.log('\nScreenshots saved: debug_pw_*.png');
}

run().catch(err => {
  console.error('\n❌  Fatal:', err.message);
  process.exit(1);
});
