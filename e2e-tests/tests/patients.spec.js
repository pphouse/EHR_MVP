import { test, expect } from '@playwright/test';

test.describe('Patient Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[placeholder*="ユーザー名"], input[name="username"]', 'demo');
    await page.fill('input[placeholder*="パスワード"], input[name="password"]', 'demo123');
    await page.click('button:has-text("サインイン"), button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display patients list', async ({ page }) => {
    // Navigate to patients page
    await page.click('text=患者');
    await expect(page).toHaveURL(/.*patients/);
    
    // Check page title or content (use specific heading)
    await expect(page.locator('h1:has-text("患者管理")')).toBeVisible();
    
    // Check if patients table is visible
    await expect(page.locator('table')).toBeVisible();
    
    // Wait for patients to load
    await expect(page.locator('table')).toBeVisible();
    
    // Check for test patients if they exist
    const hasPatients = await page.locator('tbody tr').count() > 0;
    if (hasPatients) {
      // At least one patient should be visible
      await expect(page.locator('tbody tr').first()).toBeVisible();
    }
  });

  test('should navigate to patient detail page', async ({ page }) => {
    await page.goto('/patients');
    
    // Click on patient detail button (eye icon) - first button in each row
    const detailButton = page.locator('table tbody tr').first().locator('button').first();
    await expect(detailButton).toBeVisible();
    await detailButton.click();
    
    // Should navigate to patient detail page
    await expect(page).toHaveURL(/.*patients\/\d+/);
    
    // Check patient detail content (patient name should be visible)
    await expect(page.locator('text=田中 太郎')).toBeVisible();
    await expect(page.locator('text=基本情報')).toBeVisible();
  });

  test('should show patient information in detail page', async ({ page }) => {
    await page.goto('/patients');
    
    // Click first patient detail
    const detailButton = page.locator('table tbody tr').first().locator('button').filter({ hasText: '👁' }).or(
      page.locator('table tbody tr').first().locator('button[aria-label*="詳細"], button[title*="詳細"]')
    ).or(
      page.locator('table tbody tr').first().locator('button').first()
    );
    await detailButton.click();
    
    // Wait for patient detail page
    await expect(page).toHaveURL(/.*patients\/\d+/);
    
    // Check tabs (use actual tab names from the patient detail page)
    await expect(page.locator('button:has-text("基本情報")')).toBeVisible();
    await expect(page.locator('button:has-text("診療履歴")')).toBeVisible();
    await expect(page.locator('button:has-text("医療情報")')).toBeVisible();
    
    // Check basic information tab is active by default (look for visible content)
    await expect(page.locator('text=P000001')).toBeVisible(); // Patient ID badge
    await expect(page.locator('text=生年月日')).toBeVisible(); // Date of birth label
  });

  test('should show encounters in patient detail', async ({ page }) => {
    await page.goto('/patients');
    
    // Click first patient detail
    const detailButton = page.locator('table tbody tr').first().locator('button').filter({ hasText: '👁' }).or(
      page.locator('table tbody tr').first().locator('button[aria-label*="詳細"], button[title*="詳細"]')
    ).or(
      page.locator('table tbody tr').first().locator('button').first()
    );
    await detailButton.click();
    
    // Click on encounters tab (use correct tab name)
    await page.click('button:has-text("診療履歴")');
    
    // Check encounters section (look for actual content shown in tab)
    await expect(page.locator('h6:has-text("診療履歴")')).toBeVisible();
    
    // Check if there are encounter entries (we can see some in the screenshot)
    const encounterEntry = page.locator('h6:has-text("定期検診")').first();
    await expect(encounterEntry).toBeVisible();
    
    // Test passed - encounter entries are visible
  });

  test('should create new encounter from patient page', async ({ page }) => {
    await page.goto('/patients');
    
    // Click encounter creation button (clipboard icon) - third button in each row
    const createEncounterButton = page.locator('table tbody tr').first().locator('button').nth(2);
    await expect(createEncounterButton).toBeVisible();
    await createEncounterButton.click();
    
    // Should navigate to encounter creation page
    await expect(page).toHaveURL(/.*encounters\/create/);
    
    // Check encounter creation form
    await expect(page.locator('h4:has-text("新しい診療記録の作成")')).toBeVisible();
    await expect(page.locator('text=基本情報')).toBeVisible();
  });
});