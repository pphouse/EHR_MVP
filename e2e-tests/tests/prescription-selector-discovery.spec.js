const { test, expect } = require('@playwright/test');

test.describe('処方箋セレクター発見', () => {
  test('処方箋フォームの正確なセレクターを特定', async ({ page }) => {
    console.log('🧪 処方箋セレクター発見テスト開始');
    
    try {
      // ログイン
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="username"]', 'demo');
      await page.fill('input[name="password"]', 'demo123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      console.log('✅ ログイン完了');
      
      // 処方箋作成ページ
      await page.goto('http://localhost:3000/prescriptions/create');
      await page.waitForTimeout(5000); // 十分な読み込み時間
      console.log('✅ 処方箋作成ページ表示');
      
      // ページ構造詳細調査
      console.log('\\n=== ページ構造調査 ===');
      
      // 1. Material-UI Select要素を全て検索
      const muiSelects = page.locator('.MuiSelect-root, [role="button"][aria-haspopup="listbox"]');
      const selectCount = await muiSelects.count();
      console.log(`📍 Material-UI Select数: ${selectCount}`);
      
      for (let i = 0; i < selectCount; i++) {
        const select = muiSelects.nth(i);
        const ariaLabel = await select.getAttribute('aria-label').catch(() => '');
        const id = await select.getAttribute('id').catch(() => '');
        const className = await select.getAttribute('class').catch(() => '');
        
        console.log(`  ${i+1}. Select - id="${id}" aria-label="${ariaLabel}"`);
        console.log(`      class="${className.substring(0, 100)}..."`);
        
        // 親要素の情報も取得
        const parent = select.locator('..');
        const parentLabel = await parent.locator('label').textContent().catch(() => '');
        console.log(`      親ラベル: "${parentLabel}"`);
      }
      
      // 2. FormControl要素を調査
      console.log('\\n--- FormControl調査 ---');
      const formControls = page.locator('.MuiFormControl-root');
      const formControlCount = await formControls.count();
      console.log(`📍 FormControl数: ${formControlCount}`);
      
      for (let i = 0; i < formControlCount; i++) {
        const control = formControls.nth(i);
        const label = await control.locator('label').textContent().catch(() => '');
        const input = await control.locator('input').getAttribute('name').catch(() => '');
        const hasSelect = await control.locator('[role="button"]').count();
        
        console.log(`  ${i+1}. FormControl - ラベル:"${label}" input_name:"${input}" select要素:${hasSelect}個`);
        
        if (label.includes('患者') || label.includes('診療記録')) {
          console.log(`      🎯 重要: ${label}のFormControl発見!`);
          
          // この要素の詳細なセレクター情報
          const selectButton = control.locator('[role="button"]');
          if (await selectButton.count() > 0) {
            const buttonId = await selectButton.getAttribute('id').catch(() => '');
            const buttonClass = await selectButton.getAttribute('class').catch(() => '');
            const buttonAria = await selectButton.getAttribute('aria-labelledby').catch(() => '');
            
            console.log(`        ボタンID: "${buttonId}"`);
            console.log(`        ボタンaria-labelledby: "${buttonAria}"`);
            console.log(`        ボタンclass: "${buttonClass.substring(0, 80)}..."`);
            
            // 実際にクリックテスト
            try {
              console.log(`        🔍 クリックテスト実行...`);
              await selectButton.click({ timeout: 3000 });
              await page.waitForTimeout(1000);
              
              const listbox = page.locator('[role="listbox"]');
              const isOpen = await listbox.isVisible();
              console.log(`        📋 ドロップダウン開いた: ${isOpen}`);
              
              if (isOpen) {
                const options = await listbox.locator('[role="option"]').count();
                console.log(`        📋 選択肢数: ${options}`);
                
                if (options > 0) {
                  console.log(`        ✅ 成功セレクター発見!`);
                  
                  // 第一選択肢を選択してドロップダウンを閉じる
                  await listbox.locator('[role="option"]').first().click();
                  await page.waitForTimeout(1000);
                  console.log(`        ✅ 選択完了`);
                }
              }
            } catch (clickError) {
              console.log(`        ❌ クリック失敗: ${clickError.message}`);
            }
          }
        }
      }
      
      // 3. 特定のid/name属性を持つ要素を検索
      console.log('\\n--- 特定要素検索 ---');
      const specificSelectors = [
        'input[name="patient_id"]',
        'input[name="encounter_id"]',
        '#patient-select',
        '#encounter-select',
        '[data-testid="patient-select"]',
        '[data-testid="encounter-select"]'
      ];
      
      for (const selector of specificSelectors) {
        const element = page.locator(selector);
        const exists = await element.count();
        if (exists > 0) {
          console.log(`📍 発見: ${selector} (${exists}個)`);
          
          // 関連するselect要素を探す
          const relatedSelect = element.locator('.. [role="button"]');
          const relatedCount = await relatedSelect.count();
          if (relatedCount > 0) {
            console.log(`  🎯 関連select発見: ${relatedCount}個`);
          }
        }
      }
      
      // 4. 薬剤検索フィールドも確認
      console.log('\\n--- 薬剤検索フィールド ---');
      const searchInputs = page.locator('input[placeholder*="薬剤"], input[placeholder*="検索"]');
      const searchCount = await searchInputs.count();
      console.log(`📍 薬剤検索フィールド数: ${searchCount}`);
      
      if (searchCount > 0) {
        const placeholder = await searchInputs.first().getAttribute('placeholder');
        console.log(`📍 プレースホルダー: "${placeholder}"`);
      }
      
      // 5. 作成ボタン確認
      console.log('\\n--- 作成ボタン ---');
      const createButtons = page.locator('button:has-text("処方箋を作成"), button:has-text("作成"), button:has-text("保存")');
      const buttonCount = await createButtons.count();
      console.log(`📍 作成ボタン数: ${buttonCount}`);
      
      if (buttonCount > 0) {
        const buttonText = await createButtons.first().textContent();
        const isVisible = await createButtons.first().isVisible();
        const isEnabled = await createButtons.first().isEnabled();
        console.log(`📍 ボタンテキスト: "${buttonText}" 表示:${isVisible} 有効:${isEnabled}`);
      }
      
    } catch (error) {
      console.log(`❌ テストエラー: ${error.message}`);
    }
    
    await page.screenshot({ path: 'e2e-tests/prescription-selector-discovery.png' });
    console.log('\\n🎉 処方箋セレクター発見テスト完了');
  });
});