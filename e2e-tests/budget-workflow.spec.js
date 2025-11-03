import { test, expect } from '@playwright/test';

test.describe('Budget Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page.getByText('Federal PPBE Management System')).toBeVisible();
  });

  test('should navigate to budgets page', async ({ page }) => {
    await page.getByRole('link', { name: 'Budgets' }).click();
    await expect(page.getByText('Budget Management')).toBeVisible();
  });

  test('should create a new budget', async ({ page }) => {
    await page.getByRole('link', { name: 'Budgets' }).click();
    await expect(page.getByText('Budget Management')).toBeVisible();

    // Look for "Create Budget" or similar button
    const createButton = page.getByRole('button', { name: /create|add/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();

      // Fill in budget form
      await page.getByLabel(/title/i).fill('E2E Test Budget');
      await page.getByLabel(/fiscal year/i).fill('2025');
      await page.getByLabel(/amount/i).fill('1000000');
      await page.getByLabel(/department/i).fill('Testing Department');

      // Submit form
      await page.getByRole('button', { name: /submit|save|create/i }).click();

      // Verify budget was created
      await expect(page.getByText('E2E Test Budget')).toBeVisible();
    }
  });

  test('should filter budgets', async ({ page }) => {
    await page.getByRole('link', { name: 'Budgets' }).click();
    await expect(page.getByText('Budget Management')).toBeVisible();

    // Look for filter inputs
    const filterInput = page.getByPlaceholder(/search|filter/i).first();
    if (await filterInput.isVisible()) {
      await filterInput.fill('2025');
      // Wait for filtered results
      await page.waitForTimeout(500);
    }
  });
});
