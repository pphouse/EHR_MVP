import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[placeholder*="ユーザー名"], input[name="username"]', 'demo');
    await page.fill('input[placeholder*="パスワード"], input[name="password"]', 'demo123');
    await page.click('button:has-text("サインイン"), button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should navigate between main pages', async ({ page }) => {
    // Test dashboard (greeting changes based on time)
    await expect(page.locator('text=Demo Userさん')).toBeVisible();
    
    // Navigate to patients
    await page.click('text=患者');
    await expect(page).toHaveURL(/.*patients/);
    await expect(page.locator('h1:has-text("患者管理")')).toBeVisible();
    
    // Navigate to encounters
    await page.click('text=診療記録');
    await expect(page).toHaveURL(/.*encounters/);
    await expect(page.locator('h1:has-text("診療記録")')).toBeVisible();
    
    // Navigate back to dashboard
    await page.click('text=ダッシュボード');
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Demo Userさん')).toBeVisible();
  });

  test('should have working sidebar navigation', async ({ page }) => {
    // Check if sidebar exists
    const sidebar = page.locator('nav, [role="navigation"]');
    await expect(sidebar).toBeVisible();
    
    // Check navigation links in sidebar
    await expect(page.locator('nav [role="button"]:has-text("ダッシュボード")')).toBeVisible();
    await expect(page.locator('nav [role="button"]:has-text("患者")')).toBeVisible();
    await expect(page.locator('nav [role="button"]:has-text("診療記録")')).toBeVisible();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Start at dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Navigate to patients
    await page.click('text=患者');
    await expect(page).toHaveURL(/.*patients/);
    
    // Navigate to encounters
    await page.click('text=診療記録');
    await expect(page).toHaveURL(/.*encounters/);
    
    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL(/.*patients/);
    
    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL(/.*encounters/);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Clear storage to simulate logout
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Try to access protected page
    await page.goto('/patients');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});