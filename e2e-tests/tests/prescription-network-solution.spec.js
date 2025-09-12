const { test, expect } = require('@playwright/test');

test.describe('処方箋ネットワークエラー解決', () => {
  test('処方箋作成を成功させてネットワークエラーを解決', async ({ page }) => {
    console.log('🧪 処方箋ネットワークエラー解決テスト開始');
    
    // API監視設定
    const apiLogs = [];
    let prescriptionSuccess = false;
    
    page.on('request', request => {
      if (request.url().includes('localhost:8000')) {
        apiLogs.push({
          type: 'REQUEST',
          method: request.method(),
          url: request.url(),
          body: request.postData()
        });
        
        if (request.method() === 'POST' && request.url().includes('/prescriptions/')) {
          console.log(`🚀 処方箋作成API送信: ${request.url()}`);
        }
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('localhost:8000')) {
        apiLogs.push({
          type: 'RESPONSE',
          status: response.status(),
          url: response.url()
        });
        
        if (response.url().includes('/prescriptions/') && response.request().method() === 'POST') {
          if (response.status() >= 200 && response.status() < 300) {
            prescriptionSuccess = true;
            console.log(`✅ 処方箋作成API成功: ${response.status()}`);
          } else {
            console.log(`❌ 処方箋作成API失敗: ${response.status()}`);
          }
        }
      }
    });
    
    page.on('requestfailed', request => {
      if (request.url().includes('localhost:8000')) {
        apiLogs.push({
          type: 'FAILED',
          url: request.url(),
          error: request.failure().errorText
        });
        console.log(`❌ API失敗: ${request.url()}`);
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
      
      // より正確なセレクターで患者選択
      console.log('=== 患者選択 ===');
      
      // 複数のセレクター候補を試行
      const patientSelectors = [
        'input[name="patient_id"] + div [role="button"]',
        '[data-testid="patient-select"] [role="button"]',
        'div:has-text("患者") + div [role="button"]',
        '.MuiFormControl-root:has(label:contains("患者")) [role="button"]',
        '#patient-select [role="button"]'
      ];
      
      let patientSelected = false;
      
      for (const selector of patientSelectors) {
        try {
          const patientButton = page.locator(selector).first();
          if (await patientButton.isVisible({ timeout: 2000 })) {
            console.log(`📍 患者選択ボタン発見: ${selector}`);
            await patientButton.click();
            await page.waitForTimeout(1000);
            
            const listbox = page.locator('[role="listbox"]');
            if (await listbox.isVisible({ timeout: 2000 })) {
              const options = listbox.locator('[role="option"]');
              const optionCount = await options.count();
              console.log(`📍 患者選択肢: ${optionCount}件`);
              
              if (optionCount > 0) {
                await options.first().click();
                await page.waitForTimeout(2000);
                patientSelected = true;
                console.log('✅ 患者選択完了');
                break;
              }
            }
          }
        } catch (e) {
          // 次のセレクターを試行
          continue;
        }
      }
      
      if (!patientSelected) {
        console.log('⚠️ 患者選択失敗 - 代替方法を試行');
        
        // フォームコントロールを直接検索
        const formControls = page.locator('.MuiFormControl-root');
        const formControlCount = await formControls.count();
        console.log(`📍 フォームコントロール数: ${formControlCount}`);
        
        for (let i = 0; i < formControlCount; i++) {
          const control = formControls.nth(i);
          const labelText = await control.locator('label').textContent().catch(() => '');
          
          if (labelText.includes('患者')) {
            console.log(`📍 患者フォームコントロール発見: ${i}`);
            const button = control.locator('[role="button"]');
            if (await button.isVisible()) {
              await button.click();
              await page.waitForTimeout(1000);
              
              const listbox = page.locator('[role="listbox"]');
              if (await listbox.isVisible()) {
                const options = listbox.locator('[role="option"]');
                if (await options.count() > 0) {
                  await options.first().click();
                  await page.waitForTimeout(2000);
                  patientSelected = true;
                  console.log('✅ 患者選択完了（代替方法）');
                  break;
                }
              }
            }
          }
        }
      }
      
      if (patientSelected) {
        // 診療記録選択
        console.log('=== 診療記録選択 ===');
        let encounterSelected = false;
        
        // 診療記録用のセレクター候補
        const encounterSelectors = [
          'input[name="encounter_id"] + div [role="button"]',
          '[data-testid="encounter-select"] [role="button"]',
          'div:has-text("診療記録") + div [role="button"]'
        ];
        
        for (const selector of encounterSelectors) {
          try {
            const encounterButton = page.locator(selector).first();
            if (await encounterButton.isVisible({ timeout: 2000 })) {
              console.log(`📍 診療記録選択ボタン発見: ${selector}`);
              await encounterButton.click();
              await page.waitForTimeout(1000);
              
              const listbox = page.locator('[role="listbox"]');
              if (await listbox.isVisible({ timeout: 2000 })) {
                const options = listbox.locator('[role="option"]');
                const optionCount = await options.count();
                console.log(`📍 診療記録選択肢: ${optionCount}件`);
                
                if (optionCount > 0) {
                  await options.first().click();
                  await page.waitForTimeout(2000);
                  encounterSelected = true;
                  console.log('✅ 診療記録選択完了');
                  break;
                }
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        // 代替方法で診療記録選択
        if (!encounterSelected) {
          for (let i = 0; i < formControlCount; i++) {
            const control = formControls.nth(i);
            const labelText = await control.locator('label').textContent().catch(() => '');
            
            if (labelText.includes('診療記録')) {
              console.log(`📍 診療記録フォームコントロール発見: ${i}`);
              const button = control.locator('[role="button"]');
              if (await button.isVisible()) {
                await button.click();
                await page.waitForTimeout(1000);
                
                const listbox = page.locator('[role="listbox"]');
                if (await listbox.isVisible()) {
                  const options = listbox.locator('[role="option"]');
                  if (await options.count() > 0) {
                    await options.first().click();
                    await page.waitForTimeout(2000);
                    encounterSelected = true;
                    console.log('✅ 診療記録選択完了（代替方法）');
                    break;
                  }
                }
              }
            }
          }
        }
        
        if (encounterSelected) {
          // 薬剤検索
          console.log('=== 薬剤検索 ===');
          const searchInput = page.locator('input[placeholder*="薬剤"], input[placeholder*="検索"]');
          await searchInput.fill('アセトアミノフェン');
          await page.waitForTimeout(3000);
          
          const searchResults = await page.locator('table tbody tr').count();
          console.log(`📍 検索結果: ${searchResults}件`);
          
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
              const preApiCount = apiLogs.length;
              
              console.log('🔥 処方箋作成ボタンクリック!');
              await createButton.click();
              
              // 結果監視（30秒）
              let waitTime = 0;
              const maxWait = 30000;
              
              while (waitTime < maxWait) {
                await page.waitForTimeout(1000);
                waitTime += 1000;
                
                // 成功確認
                const successVisible = await page.locator('text=処方箋が正常に作成されました').isVisible();
                if (successVisible) {
                  console.log(`🎉 処方箋作成成功! (${waitTime}ms後)`);
                  break;
                }
                
                // アラート確認
                const alertVisible = await page.locator('[role="alert"]').isVisible();
                if (alertVisible) {
                  const alertText = await page.locator('[role="alert"]').textContent();
                  console.log(`⚠️ アラート: ${alertText} (${waitTime}ms後)`);
                  break;
                }
                
                if (prescriptionSuccess) {
                  console.log(`✅ API成功確認 (${waitTime}ms後)`);
                }
                
                if (waitTime % 5000 === 0) {
                  console.log(`⏳ 監視中... ${waitTime/1000}秒`);
                }
              }
              
              // 詳細結果
              const postApiLogs = apiLogs.slice(preApiCount);
              console.log(`\\n=== 最終結果 ===`);
              console.log(`📊 作成時API: ${postApiLogs.length}件`);
              console.log(`🚀 処方箋API成功: ${prescriptionSuccess}`);
              
              if (postApiLogs.length > 0) {
                console.log('\\n📋 API詳細:');
                postApiLogs.forEach((log, i) => {
                  if (log.type === 'REQUEST') {
                    console.log(`  ${i+1}. 📤 ${log.method} ${log.url}`);
                  } else if (log.type === 'RESPONSE') {
                    const emoji = log.status >= 400 ? '🔴' : '📥';
                    console.log(`  ${i+1}. ${emoji} ${log.status} ${log.url}`);
                  }
                });
              }
              
            } else {
              console.log('❌ 作成ボタンが利用できません');
            }
          } else {
            console.log('❌ 薬剤検索結果なし');
          }
        } else {
          console.log('❌ 診療記録選択失敗');
        }
      } else {
        console.log('❌ 患者選択失敗');
      }
      
    } catch (error) {
      console.log(`❌ テストエラー: ${error.message}`);
    }
    
    await page.screenshot({ path: 'e2e-tests/prescription-network-solution.png' });
    
    console.log('\\n🎉 処方箋ネットワークエラー解決テスト完了');
    console.log(`📊 最終API成功: ${prescriptionSuccess}`);
  });
});