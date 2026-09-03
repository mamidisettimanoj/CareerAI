import { test, expect } from '@playwright/test';

test('Homepage loads and has correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/CareerAI/);
});

test('Login page redirects to authentication', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('form')).toBeVisible();
});
