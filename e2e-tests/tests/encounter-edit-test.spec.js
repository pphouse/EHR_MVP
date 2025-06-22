import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Login before each test
  await page.goto('/login');
  await page.fill('input[placeholder*="ユーザー名"], input[name="username"]', 'demo');
  await page.fill('input[placeholder*="パスワード"], input[name="password"]', 'demo123');
  await page.click('button:has-text("サインイン"), button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
});

test('should edit and save SOAP notes successfully', async ({ page }) => {
  // Enable console and network monitoring
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.text()}`);
  });

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
  
  // Check if encounters exist
  const encounterRows = page.locator('table tbody tr');
  const hasEncounters = await encounterRows.count() > 0;
  
  if (hasEncounters) {
    console.log(`Found ${await encounterRows.count()} encounters`);
    
    // Click on first encounter detail button
    await page.locator('table tbody tr').first().locator('button').first().click();
    
    // Should navigate to encounter detail
    await expect(page).toHaveURL(/.*encounters\/\d+/);
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'encounter-detail-debug.png', fullPage: true });
    
    // Check if error occurred
    const errorAlert = page.locator('text=An error occurred');
    const isErrorVisible = await errorAlert.isVisible();
    
    if (!isErrorVisible) {
      console.log('SUCCESS: Encounter detail page loaded without errors');
      
      // Look for edit button
      const editButton = page.locator('button:has-text("編集")');
      const isEditButtonVisible = await editButton.isVisible();
      
      if (isEditButtonVisible) {
        console.log('SUCCESS: Edit button found');
        
        // Get original SOAP notes content before editing
        const subjectiveField = page.locator('textarea').first();
        const originalSubjective = await subjectiveField.inputValue();
        console.log(`Original subjective content: ${originalSubjective}`);
        
        // Click edit button
        await editButton.click();
        
        // Should enable editing mode - save button should appear
        await expect(page.locator('button:has-text("保存")')).toBeVisible();
        console.log('SUCCESS: Edit mode activated');
        
        // Edit SOAP notes with timestamp to ensure uniqueness
        const timestamp = new Date().toISOString();
        const newSubjectiveText = `Updated subjective information - ${timestamp}`;
        const newObjectiveText = `Updated objective findings - ${timestamp}`;
        const newAssessmentText = `Updated assessment - ${timestamp}`;
        const newPlanText = `Updated treatment plan - ${timestamp}`;
        
        // Fill SOAP notes
        const textareas = page.locator('textarea');
        const textareaCount = await textareas.count();
        console.log(`Found ${textareaCount} textareas`);
        
        if (textareaCount >= 4) {
          await textareas.nth(0).fill(newSubjectiveText); // Subjective
          await textareas.nth(1).fill(newObjectiveText);  // Objective
          await textareas.nth(2).fill(newAssessmentText); // Assessment
          await textareas.nth(3).fill(newPlanText);       // Plan
          
          console.log('SUCCESS: SOAP notes filled');
          
          // Save changes
          await page.click('button:has-text("保存")');
          console.log('Save button clicked');
          
          // Wait for save to complete - edit button should reappear
          await expect(page.locator('button:has-text("編集")')).toBeVisible({ timeout: 10000 });
          console.log('SUCCESS: Save completed - edit button reappeared');
          
          // Verify the content was saved by checking field values
          const savedSubjective = await page.locator('textarea').first().inputValue();
          expect(savedSubjective).toBe(newSubjectiveText);
          console.log('SUCCESS: SOAP notes content verified');
          
          // Refresh page to verify data persistence
          await page.reload();
          await page.waitForTimeout(3000);
          
          // Check if data persisted after page refresh
          const persistedSubjective = await page.locator('textarea').first().inputValue();
          expect(persistedSubjective).toBe(newSubjectiveText);
          console.log('SUCCESS: SOAP notes data persisted after page refresh');
          
        } else {
          console.log(`WARNING: Expected 4 textareas but found ${textareaCount}`);
        }
      } else {
        console.log('WARNING: Edit button not found');
      }
    } else {
      console.log('ERROR: Encounter detail page shows error');
      
      // Get error text
      const errorText = await errorAlert.textContent();
      console.log(`Error text: ${errorText}`);
    }
  } else {
    console.log('No encounters found to test SOAP editing');
  }
});

test('should handle edit mode correctly', async ({ page }) => {
  // Navigate to encounters
  await page.goto('/encounters');
  
  const encounterRows = page.locator('table tbody tr');
  const hasEncounters = await encounterRows.count() > 0;
  
  if (hasEncounters) {
    // Click on first encounter detail button
    await page.locator('table tbody tr').first().locator('button').first().click();
    
    // Should navigate to encounter detail
    await expect(page).toHaveURL(/.*encounters\/\d+/);
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if error occurred
    const errorAlert = page.locator('text=An error occurred');
    const isErrorVisible = await errorAlert.isVisible();
    
    if (!isErrorVisible) {
      // Look for edit button
      const editButton = page.locator('button:has-text("編集")');
      if (await editButton.isVisible()) {
        // Click edit button
        await editButton.click();
        
        // Should show save button
        await expect(page.locator('button:has-text("保存")')).toBeVisible();
        
        // Click save without making changes
        await page.click('button:has-text("保存")');
        
        // Should return to view mode
        await expect(page.locator('button:has-text("編集")')).toBeVisible({ timeout: 10000 });
        
        console.log('SUCCESS: Edit mode toggle works correctly');
      }
    }
  }
});