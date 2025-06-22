import { test, expect } from '@playwright/test';

test.describe('Simple Encounter Edit Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[placeholder*="ユーザー名"], input[name="username"]', 'demo');
    await page.fill('input[placeholder*="パスワード"], input[name="password"]', 'demo123');
    await page.click('button:has-text("サインイン"), button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should access encounter detail and attempt edit', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`BROWSER: ${msg.text()}`);
    });

    // Monitor network requests
    page.on('response', async response => {
      const url = response.url();
      const status = response.status();
      
      if (url.includes('/encounters/') || url.includes('/patients/')) {
        console.log(`NETWORK: ${status} ${url}`);
        
        if (status >= 400) {
          try {
            const responseText = await response.text();
            console.log(`ERROR BODY: ${responseText}`);
          } catch (e) {
            console.log(`ERROR: Could not read response body`);
          }
        }
      }
    });
    
    // Navigate to encounters
    await page.goto('/encounters');
    await page.waitForTimeout(2000);
    
    // Get encounter count
    const encounterRows = page.locator('table tbody tr');
    const count = await encounterRows.count();
    console.log(`Found ${count} encounter rows`);
    
    if (count > 0) {
      // Click first encounter
      await page.locator('table tbody tr').first().locator('button').first().click();
      
      // Wait for page load
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Check for error elements
      const errorAlert = page.locator('[role="alert"]:has-text("An error occurred")');
      const isErrorVisible = await errorAlert.isVisible();
      console.log(`Error alert visible: ${isErrorVisible}`);
      
      if (!isErrorVisible) {
        // Success - try to find edit button
        const editButton = page.locator('button:has-text("編集")');
        const isEditVisible = await editButton.isVisible();
        console.log(`Edit button visible: ${isEditVisible}`);
        
        if (isEditVisible) {
          console.log('SUCCESS: Encounter detail page loaded and edit button found');
          
          // Try editing
          await editButton.click();
          await page.waitForTimeout(1000);
          
          const saveButton = page.locator('button:has-text("保存")');
          const isSaveVisible = await saveButton.isVisible();
          console.log(`Save button visible after edit: ${isSaveVisible}`);
          
          if (isSaveVisible) {
            // Try to edit SOAP note
            const textareas = page.locator('textarea');
            const textareaCount = await textareas.count();
            console.log(`Found ${textareaCount} textareas`);
            
            if (textareaCount > 0) {
              const timestamp = new Date().toISOString();
              await textareas.first().fill(`Test edit - ${timestamp}`);
              
              // Save
              await saveButton.click();
              await page.waitForTimeout(3000);
              
              const editButtonAfterSave = page.locator('button:has-text("編集")');
              const isEditVisibleAfterSave = await editButtonAfterSave.isVisible();
              console.log(`Edit button visible after save: ${isEditVisibleAfterSave}`);
              
              if (isEditVisibleAfterSave) {
                console.log('SUCCESS: Edit and save operation completed');
              } else {
                console.log('WARNING: Save operation may have failed');
              }
            }
          }
        }
      } else {
        console.log('ERROR: Encounter detail page shows error');
      }
    } else {
      console.log('No encounters found to test');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'simple-encounter-edit-final.png', fullPage: true });
  });
});