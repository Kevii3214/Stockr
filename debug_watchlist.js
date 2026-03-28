const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await browser.newPage();

  // Capture ALL console output
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
  });
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

  // Intercept ALL Supabase REST requests
  page.on('request', req => {
    const url = req.url();
    if (url.includes('supabase.co/rest') || url.includes('supabase.co/auth') || url.includes('watchlist')) {
      console.log(`\n[REQ] ${req.method()} ${url}`);
      const body = req.postData();
      if (body) console.log('[REQ BODY]', body);
      const headers = req.headers();
      if (headers['authorization']) console.log('[REQ AUTH]', headers['authorization'].slice(0, 40) + '...');
    }
  });
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('supabase.co/rest') || url.includes('supabase.co/auth') || url.includes('watchlist')) {
      const status = res.status();
      console.log(`[RES] ${status} ${url}`);
      try {
        const body = await res.text();
        if (body) console.log('[RES BODY]', body.slice(0, 300));
      } catch {}
    }
  });

  console.log('\n=== Opening app ===');
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);

  // ── Login ──
  console.log('\n=== Filling login form ===');
  await page.locator('input[placeholder="Email"]').fill('kt3428@princeton.edu');
  await page.locator('input[placeholder="Password"]').fill('Princetonkt3428');
  await page.waitForTimeout(300);

  // Click Sign In button (the button element, not text matches)
  console.log('Clicking Sign In...');
  // Find button by role or by being the element containing exactly "Sign In"
  await page.locator('text=Sign In').last().click();

  // Wait for login to complete - watch for the swipe screen to appear
  console.log('Waiting for login to complete...');
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'debug_pw_login.png' });
  console.log('Screenshot: debug_pw_login.png');

  const pageText = await page.locator('body').innerText().catch(() => '');
  console.log('Page text after login attempt:', pageText.slice(0, 300));

  // ── Navigate to Watchlist ──
  console.log('\n=== Navigating to Watchlist ===');
  // Tab bar labels
  const tabs = await page.locator('text=Watchlist').all();
  console.log(`Found ${tabs.length} elements with text "Watchlist"`);
  if (tabs.length > 0) {
    await tabs[0].click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'debug_pw_watchlist.png' });
    console.log('Screenshot: debug_pw_watchlist.png');
  } else {
    console.log('ERROR: Could not find Watchlist tab. Full page:', pageText);
    await browser.close();
    return;
  }

  // ── Test search and add ──
  console.log('\n=== Testing Search + Add ===');
  const searchInput = page.locator('input').first();
  await searchInput.fill('AAPL');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'debug_pw_search.png' });
  console.log('Screenshot: debug_pw_search.png');

  const allText = await page.locator('body').innerText().catch(() => '');
  console.log('Search results text:', allText.slice(0, 500));

  // Try clicking the + button
  const plusBtns = await page.locator('text=+').all();
  console.log(`Found ${plusBtns.length} "+" buttons`);
  if (plusBtns.length > 0) {
    console.log('Clicking + button to add AAPL...');
    await plusBtns[0].click();
    await page.waitForTimeout(3000); // wait for Supabase call
    await page.screenshot({ path: 'debug_pw_after_add.png' });
    console.log('Screenshot: debug_pw_after_add.png');
  }

  // Clear search and check watchlist
  await searchInput.fill('');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'debug_pw_watchlist_after.png' });
  console.log('Screenshot: debug_pw_watchlist_after.png');

  const finalText = await page.locator('body').innerText().catch(() => '');
  console.log('Watchlist page after add:', finalText.slice(0, 500));

  console.log('\n=== Done. Keeping browser open for 10s ===');
  await page.waitForTimeout(10000);
  await browser.close();
})();
