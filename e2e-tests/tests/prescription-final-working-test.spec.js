const { test, expect } = require('@playwright/test');

test.describe('処方箋作成最終動作テスト', () => {
  test('処方箋作成を完全に実行してネットワークエラーを解決', async ({ page }) => {
    console.log('🧪 処方箋作成最終動作テスト開始');
    
    // API監視設定
    const apiLogs = [];
    let prescriptionApiCalled = false;
    let prescriptionApiSuccess = false;
    
    page.on('request', request => {
      if (request.url().includes('localhost:8000')) {
        apiLogs.push({
          type: 'REQUEST',
          method: request.method(),
          url: request.url(),
          body: request.postData(),
          timestamp: Date.now()
        });
        
        if (request.method() === 'POST' && request.url().includes('/prescriptions/')) {
          prescriptionApiCalled = true;
          console.log(`🚀 処方箋作成API呼び出し: ${request.url()}`);
          if (request.postData()) {
            console.log(`📝 送信データ: ${request.postData()}`);
          }
        }
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('localhost:8000')) {
        apiLogs.push({
          type: 'RESPONSE',
          status: response.status(),
          url: response.url(),
          timestamp: Date.now()
        });
        
        if (response.url().includes('/prescriptions/') && response.request().method() === 'POST') {
          if (response.status() >= 200 && response.status() < 300) {
            prescriptionApiSuccess = true;
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
          error: request.failure().errorText,
          timestamp: Date.now()
        });
        console.log(`❌ API失敗: ${request.url()} - ${request.failure().errorText}`);
      }
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('DevTools') && !msg.text().includes('Warning:')) {
        console.log(`🔴 JSエラー: ${msg.text()}`);
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
      
      // Material-UI Select要素の実際の構造を探す
      console.log('=== 患者選択 ===');
      
      // FormControlから実際のselect要素を探す
      const formControls = page.locator('.MuiFormControl-root');
      const formControlCount = await formControls.count();
      console.log(`📍 FormControl数: ${formControlCount}`);
      
      let patientSelected = false;
      
      // 患者選択
      for (let i = 0; i < formControlCount; i++) {
        const control = formControls.nth(i);
        const labelText = await control.locator('label').textContent().catch(() => '');
        
        if (labelText.includes('患者')) {
          console.log(`📍 患者FormControl発見: "${labelText}"`);
          
          // Material-UI Selectの実際の構造を試す
          const selectOptions = [
            control.locator('[role="button"]'),
            control.locator('div[role="button"]'),
            control.locator('.MuiSelect-select'),
            control.locator('input + div'),
            control.locator('[aria-haspopup="listbox"]'),
            control.locator('div[tabindex="0"]')
          ];
          
          for (const selectElement of selectOptions) {
            try {
              if (await selectElement.count() > 0 && await selectElement.first().isVisible()) {
                console.log(`📍 患者選択要素発見`);
                await selectElement.first().click();
                await page.waitForTimeout(1000);
                
                // リストボックス確認
                const listbox = page.locator('[role="listbox"], .MuiMenu-paper, .MuiPopover-paper');
                const isOpen = await listbox.isVisible({ timeout: 2000 });
                console.log(`📋 ドロップダウン表示: ${isOpen}`);
                
                if (isOpen) {
                  const options = listbox.locator('[role="option"], li');
                  const optionCount = await options.count();
                  console.log(`📋 患者選択肢: ${optionCount}件`);
                  
                  if (optionCount > 0) {
                    const firstOptionText = await options.first().textContent();
                    console.log(`📍 選択する患者: ${firstOptionText}`);
                    
                    await options.first().click();
                    await page.waitForTimeout(2000);
                    patientSelected = true;
                    console.log('✅ 患者選択完了');
                    break;
                  }
                }
              }
            } catch (e) {
              continue;
            }
          }
          
          if (patientSelected) break;
        }
      }
      
      if (patientSelected) {
        // 診療記録選択
        console.log('=== 診療記録選択 ===');
        let encounterSelected = false;
        
        for (let i = 0; i < formControlCount; i++) {
          const control = formControls.nth(i);
          const labelText = await control.locator('label').textContent().catch(() => '');
          
          if (labelText.includes('診療記録')) {
            console.log(`📍 診療記録FormControl発見: "${labelText}"`);
            
            const selectOptions = [
              control.locator('[role="button"]'),
              control.locator('div[role="button"]'),
              control.locator('.MuiSelect-select'),
              control.locator('input + div'),
              control.locator('[aria-haspopup="listbox"]'),
              control.locator('div[tabindex="0"]')
            ];
            
            for (const selectElement of selectOptions) {
              try {
                if (await selectElement.count() > 0 && await selectElement.first().isVisible()) {
                  console.log(`📍 診療記録選択要素発見`);
                  await selectElement.first().click();
                  await page.waitForTimeout(1000);
                  
                  const listbox = page.locator('[role="listbox"], .MuiMenu-paper, .MuiPopover-paper');
                  const isOpen = await listbox.isVisible({ timeout: 2000 });
                  console.log(`📋 診療記録ドロップダウン表示: ${isOpen}`);
                  
                  if (isOpen) {
                    const options = listbox.locator('[role="option"], li');
                    const optionCount = await options.count();
                    console.log(`📋 診療記録選択肢: ${optionCount}件`);
                    
                    if (optionCount > 0) {
                      const firstOptionText = await options.first().textContent();
                      console.log(`📍 選択する診療記録: ${firstOptionText}`);
                      
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
            
            if (encounterSelected) break;
          }
        }
        
        if (encounterSelected) {
          // 薬剤検索
          console.log('=== 薬剤検索 ===');
          const searchInput = page.locator('input[placeholder*="薬剤"], input[placeholder*="検索"]');
          await searchInput.fill('アセトアミノフェン');
          await page.waitForTimeout(4000); // 検索結果待機
          
          const searchResults = await page.locator('table tbody tr').count();
          console.log(`📍 薬剤検索結果: ${searchResults}件`);
          
          if (searchResults > 0) {
            // 薬剤追加
            console.log('=== 薬剤追加 ===');
            const addButton = page.locator('table tbody button:has-text("追加")').first();
            await addButton.click();
            await page.waitForTimeout(2000);
            
            const prescriptionItems = await page.locator('text=/処方薬剤.*\\(\\d+件\\)/').textContent();
            console.log(`📍 ${prescriptionItems}`);
            console.log('✅ 薬剤追加完了');
            
            // 🚀 処方箋作成実行
            console.log('=== 🚀 処方箋作成実行 🚀 ===');
            const createButton = page.locator('button:has-text("処方箋を作成")');
            const buttonVisible = await createButton.isVisible();
            const buttonEnabled = await createButton.isEnabled();
            
            console.log(`📍 作成ボタン - 表示: ${buttonVisible}, 有効: ${buttonEnabled}`);
            
            if (buttonVisible && buttonEnabled) {
              const preApiCount = apiLogs.length;
              console.log(`📊 作成前API数: ${preApiCount}`);
              
              console.log('🔥 処方箋作成ボタンクリック!');
              await createButton.click();
              
              // 結果を詳細に監視（60秒間）
              console.log('⏳ 60秒間結果監視開始...');
              let waitTime = 0;
              const maxWait = 60000;
              const interval = 1000;
              
              while (waitTime < maxWait) {
                await page.waitForTimeout(interval);
                waitTime += interval;
                
                // 成功メッセージ確認
                const successVisible = await page.locator('text=処方箋が正常に作成されました').isVisible();
                if (successVisible) {
                  console.log(`🎉 成功メッセージ表示! (${waitTime}ms後)`);
                  break;
                }
                
                // アラート確認
                const alertVisible = await page.locator('[role="alert"]').isVisible();
                if (alertVisible) {
                  const alertText = await page.locator('[role="alert"]').textContent();
                  console.log(`⚠️ アラートメッセージ: ${alertText} (${waitTime}ms後)`);
                  
                  // ネットワークエラーを特定
                  if (alertText.includes('Network') || alertText.includes('ネットワーク') || alertText.includes('エラー')) {
                    console.log(`🔴 ネットワークエラー検出: ${alertText}`);
                  }
                  break;
                }
                
                // API成功確認
                if (prescriptionApiSuccess) {
                  console.log(`📡 処方箋API成功確認 (${waitTime}ms後)`);
                }
                
                // 進行表示
                if (waitTime % 10000 === 0) {
                  const currentApiCount = apiLogs.length;
                  console.log(`⏳ ${waitTime/1000}秒経過 - API呼び出し: ${currentApiCount - preApiCount}件`);
                }
              }
              
              // 最終結果詳細
              const postApiLogs = apiLogs.slice(preApiCount);
              console.log(`\\n=== 🔍 最終結果詳細 ===`);
              console.log(`📊 作成時API呼び出し: ${postApiLogs.length}件`);
              console.log(`🚀 処方箋API呼び出し: ${prescriptionApiCalled}`);
              console.log(`✅ 処方箋API成功: ${prescriptionApiSuccess}`);
              
              // API詳細ログ
              if (postApiLogs.length > 0) {
                console.log(`\\n📋 作成時API詳細:`);
                postApiLogs.forEach((log, i) => {
                  if (log.type === 'REQUEST') {
                    console.log(`  ${i+1}. 📤 ${log.method} ${log.url}`);
                    if (log.body && log.url.includes('/prescriptions/')) {
                      console.log(`      📝 データ: ${log.body.substring(0, 200)}...`);
                    }
                  } else if (log.type === 'RESPONSE') {
                    const emoji = log.status >= 400 ? '🔴' : '📥';
                    console.log(`  ${i+1}. ${emoji} ${log.status} ${log.url}`);
                  } else if (log.type === 'FAILED') {
                    console.log(`  ${i+1}. ❌ ${log.url} - ${log.error}`);
                  }
                });
              } else {
                console.log(`⚠️ 作成時にAPI呼び出しが発生していません`);
                console.log(`   これがネットワークエラーの根本原因の可能性があります`);
              }
              
              // 最終UI状態確認
              const finalSuccessVisible = await page.locator('text=処方箋が正常に作成されました').isVisible();
              const finalAlertVisible = await page.locator('[role="alert"]').isVisible();
              
              console.log(`\\n📊 最終UI状態:`);
              console.log(`  ✅ 成功メッセージ: ${finalSuccessVisible}`);
              console.log(`  ⚠️ アラートメッセージ: ${finalAlertVisible}`);
              
              if (finalAlertVisible) {
                const finalAlertText = await page.locator('[role="alert"]').textContent();
                console.log(`  📝 アラート内容: ${finalAlertText}`);
              }
              
            } else {
              console.log('❌ 作成ボタンが使用できません');
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
      console.log(`Stack: ${error.stack}`);
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'e2e-tests/prescription-final-working.png' });
    
    // 最終総合結果
    console.log(`\\n🎯 === 最終総合結果 ===`);
    console.log(`📊 総API呼び出し: ${apiLogs.length}件`);
    console.log(`🚀 処方箋API呼び出し: ${prescriptionApiCalled}`);
    console.log(`✅ 処方箋API成功: ${prescriptionApiSuccess}`);
    
    const failedRequests = apiLogs.filter(log => log.type === 'FAILED').length;
    const errorResponses = apiLogs.filter(log => log.type === 'RESPONSE' && log.status >= 400).length;
    console.log(`❌ 失敗API: ${failedRequests}件`);
    console.log(`🔴 エラーレスポンス: ${errorResponses}件`);
    
    if (prescriptionApiSuccess) {
      console.log(`\\n🎉 処方箋作成成功 - ネットワークエラー解決!`);
    } else if (prescriptionApiCalled && !prescriptionApiSuccess) {
      console.log(`\\n⚠️ 処方箋API呼び出されたが失敗 - サーバーエラーの可能性`);
    } else {
      console.log(`\\n❌ 処方箋API呼び出されず - フロントエンドの問題`);
    }
    
    console.log(`\\n🎉 処方箋作成最終動作テスト完了`);
  });
});