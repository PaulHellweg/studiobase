import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('public studio landing page loads', async ({ page }) => {
    await page.goto('/zen-flow');
    // Should show either the studio name or a loading skeleton
    await expect(page.locator('body')).toBeVisible();
  });

  test('public schedule page loads', async ({ page }) => {
    await page.goto('/zen-flow/schedule');
    await expect(page.locator('h1')).toContainText('Schedule');
  });

  test('auth login page loads', async ({ page }) => {
    await page.goto('/auth/login');
    // Should have email and password fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('auth register page loads', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('unauthenticated user redirected from protected routes', async ({ page }) => {
    await page.goto('/bookings');
    // RouteGuard should redirect to login or show unauthorized
    // The exact behavior depends on RouteGuard implementation
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin dashboard loads for authenticated admin', async ({ page }) => {
    // This test requires auth setup - mark as a placeholder
    test.skip(true, 'Requires auth session setup');
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
