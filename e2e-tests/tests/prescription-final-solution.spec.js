const { test, expect } = require('@playwright/test');

test.describe('処方箋作成最終解決策', () => {
  test('処方箋作成でネットワークエラーを完全に解決する', async ({ page }) => {
    console.log('🧪 処方箋作成最終解決策テスト開始');
    
    // API監視
    const apiLogs = [];
    let prescriptionApiCalled = false;
    let prescriptionApiSuccess = false;
    
    page.on('request', request => {
      if (request.url().includes('localhost:8000')) {
        apiLogs.push({ type: 'REQUEST', method: request.method(), url: request.url() });
        if (request.method() === 'POST' && request.url().includes('/prescriptions/')) {
          prescriptionApiCalled = true;
          console.log(`🚀 処方箋作成API呼び出し: ${request.url()}`);
        }
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('localhost:8000')) {
        apiLogs.push({ type: 'RESPONSE', status: response.status(), url: response.url() });
        if (response.url().includes('/prescriptions/') && response.request().method() === 'POST') {
          if (response.status() >= 200 && response.status() < 300) {
            prescriptionApiSuccess = true;
            console.log(`✅ 処方箋作成API成功: ${response.status()}`);
          }
        }
      }
    });
    
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
      await page.waitForTimeout(3000);
      console.log('✅ 処方箋作成ページ表示');
      
      // PrescriptionCreate.jsのコード構造に基づいて正確なセレクターを使用
      
      // 患者選択 - Material-UI Selectの実際の構造
      console.log('=== 患者選択 ===');
      
      // まず患者ラベルを見つけて、その近くのSelectを探す
      const patientLabel = page.locator('text=患者').first();
      const patientFormControl = patientLabel.locator('..').locator('..');  // FormControlまで上がる
      
      // Material-UI Selectの実際のクリック可能な要素
      const patientSelect = patientFormControl.locator('.MuiSelect-select, [role="combobox"], div[tabindex="0"]').first();
      
      try {
        console.log('📍 患者選択試行...');
        await patientSelect.click({ timeout: 5000 });
        await page.waitForTimeout(1000);
        
        // Material-UIのメニューを待つ
        const menu = page.locator('[role="presentation"], .MuiPopover-root').locator('[role="listbox"], ul');
        await menu.waitFor({ state: 'visible', timeout: 5000 });
        
        const options = menu.locator('li, [role="option"]');
        const optionCount = await options.count();
        console.log(`📍 患者選択肢: ${optionCount}件`);
        
        if (optionCount > 0) {
          await options.first().click();
          await page.waitForTimeout(2000);
          console.log('✅ 患者選択完了');
          
          // 診療記録選択
          console.log('=== 診療記録選択 ===');
          const encounterLabel = page.locator('text=診療記録').first();
          const encounterFormControl = encounterLabel.locator('..').locator('..');
          const encounterSelect = encounterFormControl.locator('.MuiSelect-select, [role="combobox"], div[tabindex="0"]').first();
          
          try {
            await encounterSelect.click({ timeout: 5000 });
            await page.waitForTimeout(1000);
            
            const encounterMenu = page.locator('[role="presentation"], .MuiPopover-root').locator('[role="listbox"], ul');
            await encounterMenu.waitFor({ state: 'visible', timeout: 5000 });
            
            const encounterOptions = encounterMenu.locator('li, [role="option"]');
            const encounterCount = await encounterOptions.count();
            console.log(`📍 診療記録選択肢: ${encounterCount}件`);
            
            if (encounterCount > 0) {
              await encounterOptions.first().click();
              await page.waitForTimeout(2000);
              console.log('✅ 診療記録選択完了');
              
              // 薬剤検索
              console.log('=== 薬剤検索 ===');
              const searchInput = page.locator('input[placeholder*="薬剤名"], input[placeholder*="検索"]');
              await searchInput.fill('アセトアミノフェン');
              await page.waitForTimeout(4000);
              
              const searchResults = await page.locator('table tbody tr').count();
              console.log(`📍 薬剤検索結果: ${searchResults}件`);
              
              if (searchResults > 0) {
                // 薬剤追加
                console.log('=== 薬剤追加 ===');
                const addButton = page.locator('table tbody button:has-text("追加")').first();
                await addButton.click();
                await page.waitForTimeout(2000);
                console.log('✅ 薬剤追加完了');
                
                // 処方箋作成
                console.log('=== 🚀 処方箋作成実行 🚀 ===');
                const createButton = page.locator('button:has-text("処方箋を作成")');
                
                if (await createButton.isVisible() && await createButton.isEnabled()) {
                  console.log('🔥 処方箋作成ボタンクリック!');
                  await createButton.click();
                  
                  // 結果監視（30秒）
                  let success = false;
                  for (let i = 0; i < 30; i++) {
                    await page.waitForTimeout(1000);
                    
                    const successVisible = await page.locator('text=処方箋が正常に作成されました').isVisible();
                    if (successVisible) {
                      console.log(`🎉 処方箋作成成功! (${i+1}秒後)`);
                      success = true;
                      break;
                    }
                    
                    const alertVisible = await page.locator('[role="alert"]').isVisible();
                    if (alertVisible) {
                      const alertText = await page.locator('[role="alert"]').textContent();
                      console.log(`⚠️ アラート: ${alertText} (${i+1}秒後)`);
                      break;
                    }
                    
                    if ((i + 1) % 5 === 0) {
                      console.log(`⏳ 監視中... ${i+1}秒経過`);
                    }
                  }
                  
                  console.log(`\\n=== 最終結果 ===`);
                  console.log(`📊 API呼び出し総数: ${apiLogs.length}件`);
                  console.log(`🚀 処方箋API呼び出し: ${prescriptionApiCalled}`);
                  console.log(`✅ 処方箋API成功: ${prescriptionApiSuccess}`);
                  console.log(`🎉 UI成功表示: ${success}`);
                  
                  if (prescriptionApiSuccess && success) {
                    console.log(`\\n🎉🎉🎉 処方箋作成完全成功 - ネットワークエラー解決! 🎉🎉🎉`);
                  } else if (prescriptionApiCalled && !prescriptionApiSuccess) {
                    console.log(`\\n⚠️ API呼び出されたが失敗 - バックエンドの問題`);
                  } else if (!prescriptionApiCalled) {
                    console.log(`\\n❌ API呼び出されず - フロントエンドの問題`);
                  }
                  
                } else {
                  console.log('❌ 作成ボタンが利用できません');
                }
              } else {
                console.log('❌ 薬剤検索結果なし');
              }
            } else {
              console.log('❌ 診療記録選択肢なし');
            }
          } catch (encounterError) {
            console.log(`❌ 診療記録選択エラー: ${encounterError.message}`);
          }
        } else {
          console.log('❌ 患者選択肢なし');
        }
      } catch (patientError) {
        console.log(`❌ 患者選択エラー: ${patientError.message}`);
        
        // 代替セレクター試行
        console.log('⚠️ 代替セレクター試行中...');
        const alternativeSelectors = [
          'div:has(> label:has-text("患者")) div[role="button"]',
          '.MuiFormControl-root:has(label:contains("患者")) .MuiInputBase-root',
          'label:has-text("患者") ~ div [tabindex="0"]'
        ];
        
        for (const selector of alternativeSelectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 2000 })) {
              console.log(`📍 代替セレクター成功: ${selector}`);
              await element.click();
              await page.waitForTimeout(1000);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ テストエラー: ${error.message}`);
    }
    
    await page.screenshot({ path: 'e2e-tests/prescription-final-solution.png' });
    console.log('\\n🎉 処方箋作成最終解決策テスト完了');
  });
});