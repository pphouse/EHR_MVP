import { test, expect } from '@playwright/test';

test.describe('Debug Encounter Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[placeholder*="ユーザー名"], input[name="username"]', 'demo');
    await page.fill('input[placeholder*="パスワード"], input[name="password"]', 'demo123');
    await page.click('button:has-text("サインイン"), button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should debug encounter detail page errors', async ({ page }) => {
    // Navigate to encounters
    await page.goto('/encounters');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of encounters list
    await page.screenshot({ path: 'debug-encounters-list.png', fullPage: true });
    
    // Check if encounters exist
    const encounterRows = page.locator('table tbody tr');
    const hasEncounters = await encounterRows.count() > 0;
    
    console.log(`Found ${await encounterRows.count()} encounter rows`);
    
    if (hasEncounters) {
      // Get encounter ID from the first row
      const firstRow = page.locator('table tbody tr').first();
      const encounterText = await firstRow.textContent();
      console.log('First encounter row text:', encounterText);
      
      // Click on first encounter detail button
      await page.locator('table tbody tr').first().locator('button').first().click();
      
      // Wait for navigation
      await page.waitForTimeout(3000);
      
      // Take screenshot of encounter detail page
      await page.screenshot({ path: 'debug-encounter-detail.png', fullPage: true });
      
      // Get current URL
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Check for various error indicators
      const errorSelectors = [
        'text=An error occurred',
        'text=Encounter not found',
        'text=診療記録が見つかりません',
        '[role="alert"]',
        '.MuiAlert-root',
        '.error'
      ];
      
      for (const selector of errorSelectors) {
        const isVisible = await page.locator(selector).isVisible();
        if (isVisible) {
          const errorText = await page.locator(selector).textContent();
          console.log(`Error found with selector "${selector}":`, errorText);
        }
      }
      
      // Check if encounter detail loaded successfully
      const encounterTitle = page.locator('h4:has-text("診療記録")');
      const isTitleVisible = await encounterTitle.isVisible();
      console.log('Encounter title visible:', isTitleVisible);
      
      // Check if edit button exists
      const editButton = page.locator('button:has-text("編集")');
      const isEditButtonVisible = await editButton.isVisible();
      console.log('Edit button visible:', isEditButtonVisible);
      
      // Check if SOAP tabs exist
      const soapTab = page.locator('text=SOAP記録');
      const isSoapTabVisible = await soapTab.isVisible();
      console.log('SOAP tab visible:', isSoapTabVisible);
      
      // Check console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('Browser console error:', msg.text());
        }
      });
      
      // Check network requests
      page.on('response', async response => {
        if (response.status() >= 400) {
          const responseText = await response.text().catch(() => 'Unable to read response');
          console.log(`Network error: ${response.status()} ${response.url()}`);
          console.log(`Response body: ${responseText}`);
        }
      });
      
      // Wait a bit more to see if anything loads
      await page.waitForTimeout(5000);
      
      // Final screenshot
      await page.screenshot({ path: 'debug-final-state.png', fullPage: true });
      
    } else {
      console.log('No encounters found in the list');
      
      // Take screenshot of empty list
      await page.screenshot({ path: 'debug-no-encounters.png', fullPage: true });
    }
  });
});