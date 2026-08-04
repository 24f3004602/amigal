import { test, expect } from '@playwright/test';

test.describe('Video Meeting', () => {
  test('should request camera permissions', async ({ page, context }) => {
    // Grant permissions
    await context.grantPermissions(['camera', 'microphone']);
    
    await page.goto('/match');
    await page.getByRole('button', { name: /start matching/i }).click();
    
    // Should show waiting/connecting state
    await expect(page.getByText(/finding someone/i)).toBeVisible();
  });

  test('should handle device denial gracefully', async ({ page, context }) => {
    // Deny permissions
    await context.clearPermissions();
    
    await page.goto('/match');
    await page.getByRole('button', { name: /start matching/i }).click();
    
    // Should show error or fallback
    await expect(
      page.getByText(/camera|microphone|permission/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('responsive layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Mobile nav should be hamburger menu
    await expect(page.getByLabel(/toggle menu/i)).toBeVisible();
  });
});
