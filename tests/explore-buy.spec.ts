import { test, expect } from '@playwright/test';
import { signUpAndLogin, navigateTo } from './helpers';

test('Buy Stock button is visible when opening stock detail from Browse', async ({ page }) => {
  await signUpAndLogin(page);

  // Navigate to Explore via nav (client-side, no page reload)
  await navigateTo(page, '/explore');

  // Switch to Browse tab
  await page.getByRole('button', { name: 'Browse' }).click();

  // Wait for stock grid to load
  await page.waitForTimeout(600);

  // Click first stock card (they have aspect-square class)
  const stockCard = page.locator('[class*="aspect-square"]').first();
  await stockCard.waitFor({ timeout: 5000 });
  await stockCard.click();

  // The Buy Stock button MUST be visible (this was the core bug — onBuy was not passed)
  await expect(page.getByRole('button', { name: /buy stock/i })).toBeVisible({ timeout: 8000 });
});

test('Can complete a buy trade from Explore → Browse', async ({ page }) => {
  await signUpAndLogin(page);
  await navigateTo(page, '/explore');

  // Switch to Browse tab
  await page.getByRole('button', { name: 'Browse' }).click();
  await page.waitForTimeout(600);

  // Click first stock card
  const stockCard = page.locator('[class*="aspect-square"]').first();
  await stockCard.waitFor({ timeout: 5000 });
  await stockCard.click();

  // Open trade modal
  await page.getByRole('button', { name: /buy stock/i }).click();

  // Trade modal should appear with Cancel button
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible({ timeout: 5000 });

  // Confirm the buy (button shows "Buy 1 Share")
  await page.getByRole('button', { name: /Buy \d+ Share/i }).click();

  // Trade modal closes — Cancel button gone, Buy Stock button back in main modal
  await expect(page.getByRole('button', { name: 'Cancel' })).not.toBeVisible({ timeout: 5000 });
});
