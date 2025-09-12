const { test, expect } = require('@playwright/test');

test.describe('処方箋ネットワークエラー最終デバッグ', () => {
  test('処方箋作成でネットワークエラーを完全解決', async ({ page }) => {
    console.log('🧪 処方箋ネットワークエラー最終デバッグ開始');
    
    // API監視を最も詳細に設定
    const apiLogs = [];
    let prescriptionApiSuccess = false;
    
    page.on('request', request => {
      if (request.url().includes('localhost:8000')) {
        const logEntry = {
          type: 'REQUEST',
          method: request.method(),
          url: request.url(),
          headers: request.headers(),
          body: request.postData(),
          timestamp: new Date().toISOString()
        };
        apiLogs.push(logEntry);
        
        if (request.method() === 'POST' && request.url().includes('/prescriptions')) {
          console.log(`🚀 処方箋作成API送信: ${request.url()}`);
          if (request.postData()) {
            console.log(`📝 送信データ: ${request.postData()}`);
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
        
        // レスポンスボディも取得
        try {
          const responseBody = await response.text();
          logEntry.body = responseBody;
        } catch (e) {
          logEntry.bodyError = e.message;
        }
        
        apiLogs.push(logEntry);
        
        if (response.url().includes('/prescriptions') && response.request().method() === 'POST') {
          console.log(`🎯 処方箋作成レスポンス: ${response.status()}`);
          if (response.status() >= 200 && response.status() < 300) {
            prescriptionApiSuccess = true;
            console.log(`✅ 処方箋作成API成功!`);
          } else {
            console.log(`❌ 処方箋作成API失敗: ${response.status()}`);
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
    
    // JSエラー監視
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Download the React DevTools')) {
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
      console.log('✅ ページ表示完了');
      
      // 患者選択
      console.log('=== 患者選択 ===');
      const patientSelectButton = page.locator('label:has-text("患者") + div [role="button"]').first();
      await patientSelectButton.click();
      await page.waitForTimeout(1000);
      
      const patientOptions = page.locator('[role="listbox"] [role="option"]');
      const patientCount = await patientOptions.count();
      console.log(`📍 患者オプション数: ${patientCount}`);
      
      if (patientCount > 0) {
        const firstPatient = patientOptions.first();
        const patientText = await firstPatient.textContent();
        console.log(`📍 選択する患者: ${patientText}`);
        await firstPatient.click();
        await page.waitForTimeout(2000);
        console.log('✅ 患者選択完了');
        
        // 診療記録選択
        console.log('=== 診療記録選択 ===');
        const encounterSelectButton = page.locator('label:has-text("診療記録") + div [role="button"]').first();
        await encounterSelectButton.click();
        await page.waitForTimeout(1000);
        
        const encounterOptions = page.locator('[role="listbox"] [role="option"]');
        const encounterCount = await encounterOptions.count();
        console.log(`📍 診療記録オプション数: ${encounterCount}`);
        
        if (encounterCount > 0) {
          const firstEncounter = encounterOptions.first();
          const encounterText = await firstEncounter.textContent();
          console.log(`📍 選択する診療記録: ${encounterText}`);
          await firstEncounter.click();
          await page.waitForTimeout(2000);
          console.log('✅ 診療記録選択完了');
          
          // 薬剤検索
          console.log('=== 薬剤検索 ===');
          const searchInput = page.locator('input[placeholder*="薬剤名"]');
          await searchInput.fill('アセトアミノフェン');
          await page.waitForTimeout(3000);
          
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
            
            // 🚀 処方箋作成 - ここが重要
            console.log('=== 🚀 処方箋作成実行 🚀 ===');
            
            // 作成前の状態確認
            const createButton = page.locator('button:has-text("処方箋を作成")');
            const buttonVisible = await createButton.isVisible();
            const buttonEnabled = await createButton.isEnabled();
            console.log(`📍 作成ボタン - 表示: ${buttonVisible}, 有効: ${buttonEnabled}`);
            
            if (buttonVisible && buttonEnabled) {
              const preCreateApiCount = apiLogs.length;
              
              console.log('🔥 処方箋作成ボタンクリック!');
              await createButton.click();
              
              // 結果を30秒間監視
              console.log('⏳ 30秒間監視開始...');
              let waitTime = 0;
              const maxWait = 30000;
              const interval = 1000;
              
              while (waitTime < maxWait) {
                await page.waitForTimeout(interval);
                waitTime += interval;
                
                // UI状態確認
                const successMessage = await page.locator('text=処方箋が正常に作成されました').isVisible();
                const alertMessage = await page.locator('[role="alert"]').isVisible();
                const errorMessage = await page.locator('text=エラー').isVisible();
                
                if (successMessage) {
                  console.log(`🎉 成功メッセージ表示 (${waitTime}ms後)`);
                  break;
                }
                
                if (alertMessage) {
                  const alertText = await page.locator('[role="alert"]').textContent();
                  console.log(`⚠️ アラート表示 (${waitTime}ms後): ${alertText}`);
                  break;
                }
                
                if (errorMessage) {
                  const errorText = await page.locator('text=エラー').textContent();
                  console.log(`❌ エラー表示 (${waitTime}ms後): ${errorText}`);
                  break;
                }
                
                // API成功確認
                if (prescriptionApiSuccess) {
                  console.log(`📡 処方箋API成功確認 (${waitTime}ms後)`);
                }
                
                // 進行表示（5秒ごと）
                if (waitTime % 5000 === 0) {
                  console.log(`⏳ 監視中... ${waitTime/1000}秒経過`);
                }
              }
              
              // 最終結果
              console.log('=== 最終結果 ===');
              const postCreateApiLogs = apiLogs.slice(preCreateApiCount);
              console.log(`📊 作成時API呼び出し: ${postCreateApiLogs.length}件`);
              console.log(`📊 処方箋API成功: ${prescriptionApiSuccess}`);
              
              // 詳細ログ出力
              if (postCreateApiLogs.length > 0) {
                console.log('\\n📋 作成時API詳細:');
                postCreateApiLogs.forEach((log, i) => {
                  if (log.type === 'REQUEST') {
                    console.log(`  ${i+1}. 📤 ${log.method} ${log.url}`);
                    if (log.body && log.url.includes('/prescriptions')) {
                      console.log(`      📝 Body: ${log.body}`);
                    }
                  } else if (log.type === 'RESPONSE') {
                    const emoji = log.status >= 400 ? '🔴' : '📥';
                    console.log(`  ${i+1}. ${emoji} ${log.status} ${log.url}`);
                    if (log.body && log.url.includes('/prescriptions')) {
                      console.log(`      📥 Response: ${log.body}`);
                    }
                  } else if (log.type === 'FAILED') {
                    console.log(`  ${i+1}. ❌ ${log.url} - ${log.error}`);
                  }
                });
              } else {
                console.log('⚠️ 作成時にAPI呼び出しが発生していません - これがネットワークエラーの原因');
              }
              
            } else {
              console.log('❌ 作成ボタンが使用できません');
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
    await page.screenshot({ path: 'e2e-tests/prescription-network-final-debug.png' });
    
    // 最終統計
    const totalRequests = apiLogs.filter(log => log.type === 'REQUEST').length;
    const totalResponses = apiLogs.filter(log => log.type === 'RESPONSE').length;
    const failedRequests = apiLogs.filter(log => log.type === 'FAILED').length;
    const errorResponses = apiLogs.filter(log => log.type === 'RESPONSE' && log.status >= 400).length;
    
    console.log('\\n📊 最終統計:');
    console.log(`  📤 総リクエスト: ${totalRequests}件`);
    console.log(`  📥 総レスポンス: ${totalResponses}件`);
    console.log(`  ❌ 失敗リクエスト: ${failedRequests}件`);
    console.log(`  🔴 エラーレスポンス: ${errorResponses}件`);
    console.log(`  🚀 処方箋API成功: ${prescriptionApiSuccess}`);
    
    console.log('\\n🎉 処方箋ネットワークエラー最終デバッグ完了');
  });
});