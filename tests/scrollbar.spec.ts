import { test, expect } from '@playwright/test';
import { signUpAndLogin, navigateTo } from './helpers';

test('Main content area has no visible scrollbar', async ({ page }) => {
  await signUpAndLogin(page);
  await navigateTo(page, '/explore');

  // Wait for content to render
  await page.waitForTimeout(500);

  const mainEl = page.locator('main');
  await expect(mainEl).toBeVisible();

  // scrollbar-width: none should be applied (Firefox)
  const scrollbarWidth = await mainEl.evaluate((el) => {
    return window.getComputedStyle(el).getPropertyValue('scrollbar-width');
  });
  expect(scrollbarWidth).toBe('none');
});

test('Main area scrolls but has no scrollbar track visible', async ({ page }) => {
  await signUpAndLogin(page);
  await navigateTo(page, '/explore');
  await page.getByRole('button', { name: 'Browse' }).click();
  await page.waitForTimeout(500);

  // offsetWidth should equal clientWidth when scrollbar is hidden
  const hasNoScrollbar = await page.locator('main').evaluate((el) => {
    return el.offsetWidth === el.clientWidth;
  });
  expect(hasNoScrollbar).toBe(true);
});
