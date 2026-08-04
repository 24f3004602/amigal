import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    // HTML5 validation or custom validation should appear
    await expect(page.getByText(/invalid/i).or(page.locator('input:invalid'))).toBeTruthy();
  });

  test('should login and redirect to dashboard', async ({ page }) => {
    // This would use test credentials or mock API in test env
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/password/i).fill('SecurePass123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL('/match', { timeout: 10000 });
    await expect(page.getByText(/find a match/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/password/i);
    await passwordInput.fill('secret123');
    
    await page.getByLabel(/show password/i).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    await page.getByLabel(/hide password/i).click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
