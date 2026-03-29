import { test, expect } from '@playwright/test';
import { signUpAndLogin, navigateTo } from './helpers';

test('Plan tab shows inline Baggio AI chat header', async ({ page }) => {
  await signUpAndLogin(page);
  await navigateTo(page, '/explore');

  // Switch to Plan tab
  await page.getByRole('button', { name: 'Plan' }).click();

  // Baggio header should appear inline (not in a modal)
  await expect(page.getByText('Baggio AI')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/investment planner/i)).toBeVisible({ timeout: 3000 });

  // Online indicator
  await expect(page.getByText('Online')).toBeVisible({ timeout: 3000 });
});

test('Baggio sends greeting message on Plan tab open', async ({ page }) => {
  await signUpAndLogin(page);
  await navigateTo(page, '/explore');

  await page.getByRole('button', { name: 'Plan' }).click();

  // Baggio greeting message should appear after ~1 second
  await expect(page.getByText(/level/i).first()).toBeVisible({ timeout: 5000 });
  // The greeting mentions XP
  await expect(page.getByText(/xp/i).first()).toBeVisible({ timeout: 3000 });
});

test('Quick prompt chips are visible', async ({ page }) => {
  await signUpAndLogin(page);
  await navigateTo(page, '/explore');
  await page.getByRole('button', { name: 'Plan' }).click();

  // Wait for greeting to load
  await page.waitForTimeout(2000);

  // New guided flow shows experience-level chips first
  await expect(page.getByRole('button', { name: '🌱 Beginner' })).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: '📈 Intermediate' })).toBeVisible();
  await expect(page.getByRole('button', { name: '🚀 Advanced' })).toBeVisible();
});

test('Can send a message to Baggio and receive a response', async ({ page }) => {
  await signUpAndLogin(page);
  await navigateTo(page, '/explore');
  await page.getByRole('button', { name: 'Plan' }).click();

  // Wait for greeting
  await page.waitForTimeout(2000);

  // Type and send a message
  await page.getByPlaceholder('Ask Baggio anything...').fill('help');
  await page.getByPlaceholder('Ask Baggio anything...').press('Enter');

  // Our message appears (exact match avoids matching Baggio's response that also contains 'help')
  await expect(page.getByText('help', { exact: true })).toBeVisible({ timeout: 3000 });

  // AI response appears after typing delay (up to 3s)
  await expect(page.locator('[class*="bg-slate-800/70"]').last()).toBeVisible({ timeout: 5000 });
});

test('Old AI chat modal overlay is gone', async ({ page }) => {
  await signUpAndLogin(page);
  await navigateTo(page, '/explore');
  await page.getByRole('button', { name: 'Plan' }).click();
  await page.waitForTimeout(1000);

  // The old "AI Investment Buddy" modal header should not exist
  await expect(page.getByText('AI Investment Buddy')).not.toBeVisible({ timeout: 2000 });

  // No backdrop overlay
  await expect(page.locator('[class*="fixed"][class*="inset-0"][class*="bg-black"]')).not.toBeVisible({ timeout: 2000 });
});
