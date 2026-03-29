import { test, expect } from '@playwright/test';
import { signUpAndLogin } from './helpers';

test('sign up creates account and redirects to home', async ({ page }) => {
  await signUpAndLogin(page);
  // Should be at / with nav visible
  await expect(page.getByRole('button', { name: 'Explore' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Swipe' })).toBeVisible();
});
