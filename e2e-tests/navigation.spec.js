import { test, expect } from '@playwright/test';

test.describe('Navigation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page.getByText('Federal PPBE Management System')).toBeVisible();
  });

  test('should navigate to all main pages', async ({ page }) => {
    // Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');

    // Budgets
    await page.getByRole('link', { name: 'Budgets' }).click();
    await expect(page).toHaveURL('/budgets');
    await expect(page.getByText('Budget Management')).toBeVisible();

    // Programs
    await page.getByRole('link', { name: 'Programs' }).click();
    await expect(page).toHaveURL('/programs');
    await expect(page.getByText('Program Management')).toBeVisible();

    // Execution
    await page.getByRole('link', { name: 'Execution' }).click();
    await expect(page).toHaveURL('/execution');
    await expect(page.getByText('Execution Tracking')).toBeVisible();
  });

  test('should maintain navigation state', async ({ page }) => {
    // Navigate to budgets
    await page.getByRole('link', { name: 'Budgets' }).click();
    await expect(page).toHaveURL('/budgets');

    // Reload page
    await page.reload();
    await expect(page).toHaveURL('/budgets');
    await expect(page.getByText('Budget Management')).toBeVisible();
  });
});
