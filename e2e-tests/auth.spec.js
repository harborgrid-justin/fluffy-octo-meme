import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.getByText('PPBE Management System')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('should login with admin credentials', async ({ page }) => {
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /login/i }).click();

    // Should redirect to dashboard
    await expect(page.getByText('Federal PPBE Management System')).toBeVisible();
    await expect(page.getByText('admin')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByLabel('Username').fill('wronguser');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page.getByText(/invalid credentials|login failed/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /login/i }).click();

    // Wait for dashboard to load
    await expect(page.getByText('Federal PPBE Management System')).toBeVisible();

    // Logout
    await page.getByRole('button', { name: /logout/i }).click();

    // Should return to login page
    await expect(page.getByText('PPBE Management System')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
  });
});
