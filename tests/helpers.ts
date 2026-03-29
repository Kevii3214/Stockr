import { Page } from '@playwright/test';

/** Dismiss the loading splash screen if visible */
export async function skipLoadingScreen(page: Page) {
  const skipBtn = page.getByRole('button', { name: 'Skip' });
  try {
    await skipBtn.waitFor({ timeout: 4000 });
    await skipBtn.click();
  } catch {
    // Not visible — already past loading screen
  }
}

/** Navigate to a path within the SPA by clicking the nav button (avoids full-page reload) */
export async function navigateTo(page: Page, path: '/explore' | '/watchlist' | '/portfolio' | '/profile' | '/') {
  const labels: Record<string, string> = {
    '/explore': 'Explore',
    '/watchlist': 'Watchlist',
    '/portfolio': 'Portfolio',
    '/profile': 'Profile',
    '/': 'Swipe',
  };
  const nav = page.getByRole('button', { name: labels[path], exact: true });
  await nav.waitFor({ timeout: 10000 });
  await nav.click();
}

export async function signUpAndLogin(page: Page) {
  const ts = Date.now();
  const email = `testuser+${ts}@mailinator.com`;
  const password = 'Test1234!';
  const firstName = 'Test';
  const lastName = `User${ts}`;

  await page.goto('/signup');

  // Dismiss loading screen if it shows up first
  await skipLoadingScreen(page);

  await page.getByPlaceholder('First name').fill(firstName);
  await page.getByPlaceholder('Last name').fill(lastName);
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password', { exact: true }).fill(password);
  await page.getByPlaceholder('Confirm password').fill(password);
  await page.getByRole('button', { name: /sign up/i }).click();

  // Wait for redirect to home
  await page.waitForURL('/', { timeout: 15000 });

  // Dismiss the Logo loading page that shows after signup
  await skipLoadingScreen(page);

  // Wait for nav to be ready
  await page.getByRole('button', { name: 'Explore' }).waitFor({ timeout: 10000 });

  return { email, password };
}
