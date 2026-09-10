import { test, expect } from '@playwright/test';

test('Homepage loads and has correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/CareerAI/);
});

test('Dashboard redirects or loads properly', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('text=CareerAI').first()).toBeVisible();
});
