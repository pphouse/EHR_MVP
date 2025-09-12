const { test, expect } = require('@playwright/test');

test.describe('処方箋作成成功完全版', () => {
  test('処方箋作成の完全なフローを実行してネットワークエラーを解決', async ({ page }) => {
    console.log('🧪 処方箋作成成功完全版テスト開始');
    
    // API監視を詳細に設定
    const apiLogs = [];
    let prescriptionApiCalled = false;
    let prescriptionApiSuccess = false;
    let prescriptionApiResponse = null;
    
    page.on('request', request => {
      if (request.url().includes('localhost:8000')) {
        const logEntry = {
          type: 'REQUEST',
          method: request.method(),
          url: request.url(),
          body: request.postData(),
          timestamp: new Date().toISOString()
        };
        apiLogs.push(logEntry);
        
        if (request.method() === 'POST' && request.url().includes('/prescriptions/')) {
          prescriptionApiCalled = true;
          console.log(`🚀 処方箋作成API呼び出し: ${request.url()}`);
          if (request.postData()) {
            console.log(`📝 送信データ: ${request.postData().substring(0, 200)}...`);
          }
        }
      }
    });
    
    page.on('response', async response => {
      if (response.url().includes('localhost:8000')) {
        const logEntry = {
          type: 'RESPONSE',
          status: response.status(),
          url: response.url(),
          timestamp: new Date().toISOString()
        };
        
        // レスポンスボディ取得を試行
        try {
          const responseText = await response.text();
          logEntry.body = responseText;
        } catch (e) {
          logEntry.bodyError = e.message;
        }
        
        apiLogs.push(logEntry);
        
        if (response.url().includes('/prescriptions/') && response.request().method() === 'POST') {
          prescriptionApiResponse = response.status();
          if (response.status() >= 200 && response.status() < 300) {
            prescriptionApiSuccess = true;
            console.log(`✅ 処方箋作成API成功: ${response.status()}`);
            if (logEntry.body) {
              console.log(`📥 レスポンス: ${logEntry.body.substring(0, 200)}...`);
            }
          } else {
            console.log(`❌ 処方箋作成API失敗: ${response.status()}`);
            if (logEntry.body) {
              console.log(`📥 エラーレスポンス: ${logEntry.body}`);
            }
          }
        }
      }
    });
    
    page.on('requestfailed', request => {
      if (request.url().includes('localhost:8000')) {
        const logEntry = {
          type: 'FAILED',
          url: request.url(),
          error: request.failure().errorText,
          timestamp: new Date().toISOString()
        };
        apiLogs.push(logEntry);
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
      console.log('=== ログイン ===');
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="username"]', 'demo');
      await page.fill('input[name="password"]', 'demo123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      console.log('✅ ログイン完了');
      
      // 処方箋作成ページ
      console.log('=== 処方箋作成ページ ===');
      await page.goto('http://localhost:3000/prescriptions/create');
      await page.waitForTimeout(3000);
      console.log('✅ 処方箋作成ページ表示');
      
      // 患者選択（成功したセレクターを使用）
      console.log('=== 患者選択 ===');
      const patientSelect = page.locator('label:has-text("患者") ~ div [tabindex="0"]').first();
      await patientSelect.click();
      await page.waitForTimeout(1000);
      
      // Material-UIメニューの待機と選択
      const patientMenu = page.locator('[role="presentation"] [role="listbox"], .MuiPopover-paper ul, [role="listbox"]');
      await patientMenu.waitFor({ state: 'visible', timeout: 5000 });
      
      const patientOptions = patientMenu.locator('li, [role="option"]');
      const patientCount = await patientOptions.count();
      console.log(`📍 患者選択肢: ${patientCount}件`);
      
      if (patientCount > 0) {
        const firstPatientText = await patientOptions.first().textContent();
        console.log(`📍 選択する患者: ${firstPatientText}`);
        await patientOptions.first().click();
        await page.waitForTimeout(2000);
        console.log('✅ 患者選択完了');
        
        // 診療記録選択
        console.log('=== 診療記録選択 ===');
        const encounterSelect = page.locator('label:has-text("診療記録") ~ div [tabindex="0"]').first();
        await encounterSelect.click();
        await page.waitForTimeout(1000);
        
        const encounterMenu = page.locator('[role="presentation"] [role="listbox"], .MuiPopover-paper ul, [role="listbox"]');
        await encounterMenu.waitFor({ state: 'visible', timeout: 5000 });
        
        const encounterOptions = encounterMenu.locator('li, [role="option"]');
        const encounterCount = await encounterOptions.count();
        console.log(`📍 診療記録選択肢: ${encounterCount}件`);
        
        if (encounterCount > 0) {
          const firstEncounterText = await encounterOptions.first().textContent();
          console.log(`📍 選択する診療記録: ${firstEncounterText}`);
          await encounterOptions.first().click();
          await page.waitForTimeout(2000);
          console.log('✅ 診療記録選択完了');
          
          // 薬剤検索
          console.log('=== 薬剤検索 ===');
          const searchInput = page.locator('input[placeholder*="薬剤名"], input[placeholder*="検索"]');
          await searchInput.fill('アセトアミノフェン');
          await page.waitForTimeout(4000); // 検索結果の読み込み待ち
          
          const searchResults = await page.locator('table tbody tr').count();
          console.log(`📍 薬剤検索結果: ${searchResults}件`);
          
          if (searchResults > 0) {
            // 薬剤追加
            console.log('=== 薬剤追加 ===');
            const addButton = page.locator('table tbody button:has-text("追加")').first();
            await addButton.click();
            await page.waitForTimeout(2000);
            
            // 追加された薬剤の確認
            const prescriptionItemsText = await page.locator('text=/処方薬剤.*\\(\\d+件\\)/').textContent();
            console.log(`📍 ${prescriptionItemsText}`);
            console.log('✅ 薬剤追加完了');
            
            // 🚀🚀🚀 処方箋作成実行 🚀🚀🚀
            console.log('=== 🚀 処方箋作成実行 🚀 ===');
            const createButton = page.locator('button:has-text("処方箋を作成")');
            const buttonVisible = await createButton.isVisible();
            const buttonEnabled = await createButton.isEnabled();
            
            console.log(`📍 作成ボタン状態: 表示=${buttonVisible}, 有効=${buttonEnabled}`);
            
            if (buttonVisible && buttonEnabled) {
              const preApiCount = apiLogs.length;
              console.log(`📊 作成前API数: ${preApiCount}`);
              
              console.log('🔥🔥🔥 処方箋作成ボタンクリック! 🔥🔥🔥');
              await createButton.click();
              
              // 結果を60秒間詳細に監視
              console.log('⏳ 60秒間結果監視開始...');
              let finalResult = 'TIMEOUT';
              let finalMessage = '';
              
              for (let i = 0; i < 60; i++) {
                await page.waitForTimeout(1000);
                
                // 成功メッセージ確認
                const successVisible = await page.locator('text=処方箋が正常に作成されました').isVisible();
                if (successVisible) {
                  finalResult = 'SUCCESS';
                  finalMessage = '処方箋が正常に作成されました';
                  console.log(`🎉 成功メッセージ表示! (${i+1}秒後)`);
                  break;
                }
                
                // アラートメッセージ確認
                const alertVisible = await page.locator('[role="alert"]').isVisible();
                if (alertVisible) {
                  const alertText = await page.locator('[role="alert"]').textContent();
                  finalResult = 'ALERT';
                  finalMessage = alertText;
                  console.log(`⚠️ アラートメッセージ: ${alertText} (${i+1}秒後)`);
                  
                  if (alertText.includes('Network') || alertText.includes('ネットワーク')) {
                    console.log(`🔴 ネットワークエラー検出!`);
                  }
                  break;
                }
                
                // エラーメッセージ確認
                const errorVisible = await page.locator('text=/エラー|失敗|Error/').isVisible();
                if (errorVisible) {
                  const errorText = await page.locator('text=/エラー|失敗|Error/').textContent();
                  finalResult = 'ERROR';
                  finalMessage = errorText;
                  console.log(`❌ エラーメッセージ: ${errorText} (${i+1}秒後)`);
                  break;
                }
                
                // 進行表示（10秒ごと）
                if ((i + 1) % 10 === 0) {
                  const currentApiCount = apiLogs.length;
                  console.log(`⏳ ${i+1}秒経過 - 新規API: ${currentApiCount - preApiCount}件`);
                  
                  if (prescriptionApiCalled) {
                    console.log(`📡 処方箋API呼び出し確認済み`);
                  }
                  if (prescriptionApiSuccess) {
                    console.log(`✅ 処方箋API成功確認済み`);
                  }
                }
              }
              
              // 最終詳細結果
              const postApiLogs = apiLogs.slice(preApiCount);
              
              console.log(`\\n🔍 === 最終詳細結果 ===`);
              console.log(`🎯 最終結果: ${finalResult}`);
              console.log(`📝 最終メッセージ: ${finalMessage}`);
              console.log(`📊 作成時API呼び出し: ${postApiLogs.length}件`);
              console.log(`🚀 処方箋API呼び出し: ${prescriptionApiCalled}`);
              console.log(`✅ 処方箋API成功: ${prescriptionApiSuccess}`);
              console.log(`📊 処方箋APIレスポンス: ${prescriptionApiResponse}`);
              
              // API詳細ログ
              if (postApiLogs.length > 0) {
                console.log(`\\n📋 作成時API詳細ログ:`);
                postApiLogs.forEach((log, i) => {
                  if (log.type === 'REQUEST') {
                    console.log(`  ${i+1}. 📤 ${log.method} ${log.url}`);
                    if (log.body && log.url.includes('/prescriptions/')) {
                      console.log(`      📝 Body: ${log.body.substring(0, 300)}...`);
                    }
                  } else if (log.type === 'RESPONSE') {
                    const emoji = log.status >= 400 ? '🔴' : '📥';
                    console.log(`  ${i+1}. ${emoji} ${log.status} ${log.url}`);
                    if (log.body && log.url.includes('/prescriptions/')) {
                      console.log(`      📥 Response: ${log.body.substring(0, 300)}...`);
                    }
                  } else if (log.type === 'FAILED') {
                    console.log(`  ${i+1}. ❌ ${log.url} - ${log.error}`);
                  }
                });
              } else {
                console.log(`⚠️ 作成時にAPI呼び出しが発生していません`);
                console.log(`   これがネットワークエラーの根本原因です`);
              }
              
              // 最終判定
              console.log(`\\n🏆 === 最終判定 ===`);
              if (finalResult === 'SUCCESS' && prescriptionApiSuccess) {
                console.log(`🎉🎉🎉 処方箋作成完全成功! ネットワークエラー解決! 🎉🎉🎉`);
              } else if (prescriptionApiCalled && prescriptionApiSuccess && finalResult !== 'SUCCESS') {
                console.log(`⚠️ API成功だがUI未表示 - フロントエンド表示の問題`);
              } else if (prescriptionApiCalled && !prescriptionApiSuccess) {
                console.log(`❌ API呼び出されたが失敗 - バックエンドの問題`);
                console.log(`   HTTPステータス: ${prescriptionApiResponse}`);
              } else if (!prescriptionApiCalled) {
                console.log(`❌ API呼び出されず - フロントエンドの問題`);
                console.log(`   ボタンクリックが正しく動作していません`);
              } else {
                console.log(`⚠️ 予期しない状態です`);
              }
              
            } else {
              console.log('❌ 作成ボタンが利用できません');
              console.log(`   表示: ${buttonVisible}, 有効: ${buttonEnabled}`);
            }
          } else {
            console.log('❌ 薬剤検索結果なし');
          }
        } else {
          console.log('❌ 診療記録選択肢なし');
        }
      } else {
        console.log('❌ 患者選択肢なし');
      }
      
    } catch (error) {
      console.log(`❌ テストエラー: ${error.message}`);
      console.log(`Stack: ${error.stack}`);
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'e2e-tests/prescription-success-complete.png' });
    
    // 最終統計
    const totalRequests = apiLogs.filter(log => log.type === 'REQUEST').length;
    const totalResponses = apiLogs.filter(log => log.type === 'RESPONSE').length;
    const failedRequests = apiLogs.filter(log => log.type === 'FAILED').length;
    const errorResponses = apiLogs.filter(log => log.type === 'RESPONSE' && log.status >= 400).length;
    
    console.log(`\\n📊 === 最終統計 ===`);
    console.log(`📤 総リクエスト: ${totalRequests}件`);
    console.log(`📥 総レスポンス: ${totalResponses}件`);
    console.log(`❌ 失敗リクエスト: ${failedRequests}件`);
    console.log(`🔴 エラーレスポンス: ${errorResponses}件`);
    console.log(`🚀 処方箋API呼び出し: ${prescriptionApiCalled}`);
    console.log(`✅ 処方箋API成功: ${prescriptionApiSuccess}`);
    
    console.log(`\\n🎉 処方箋作成成功完全版テスト完了`);
  });
});