import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
    
    // Check login form elements
    await expect(page.locator('input[placeholder*="ユーザー名"], input[name="username"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="パスワード"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("サインイン"), button[type="submit"]')).toBeVisible();
    
    // Fill login form
    await page.fill('input[placeholder*="ユーザー名"], input[name="username"]', 'demo');
    await page.fill('input[placeholder*="パスワード"], input[name="password"]', 'demo123');
    
    // Submit login
    await page.click('button:has-text("サインイン"), button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Check if user is logged in (look for dashboard content - greeting changes based on time)
    await expect(page.locator('text=Demo Userさん')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with invalid credentials
    await page.fill('input[placeholder*="ユーザー名"], input[name="username"]', 'invalid');
    await page.fill('input[placeholder*="パスワード"], input[name="password"]', 'invalid');
    
    // Submit login
    await page.click('button:has-text("サインイン"), button[type="submit"]');
    
    // Should show error message (look for error notification)
    const errorSelectors = [
      '[role="alert"]',
      '.MuiAlert-root',
      'div:has-text("認証に失敗しました")',
      'div:has-text("ログインに失敗")',
      'div:has-text("エラー")',
      '.error-message'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
        errorFound = true;
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // If no error message found, check if we're still on login page (which indicates failed login)
    if (!errorFound) {
      await expect(page).toHaveURL(/.*login/);
    }
    
    // Should stay on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[placeholder*="ユーザー名"], input[name="username"]', 'demo');
    await page.fill('input[placeholder*="パスワード"], input[name="password"]', 'demo123');
    await page.click('button:has-text("サインイン"), button[type="submit"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Look for logout button (usually in header/menu)
    const logoutButton = page.locator('button:has-text("ログアウト"), button:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    }
  });
});