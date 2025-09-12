const { test, expect } = require('@playwright/test');

test.describe('処方箋作成最終実テスト', () => {
  test('処方箋を実際に作成してネットワークエラーを特定', async ({ page }) => {
    console.log('🧪 処方箋作成最終実テスト開始');
    
    // APIコール監視（localhost:8000のみ）
    const apiLogs = [];
    
    page.on('request', request => {
      if (request.url().includes('localhost:8000')) {
        apiLogs.push({
          type: 'REQUEST',
          method: request.method(),
          url: request.url(),
          body: request.postData(),
          headers: request.headers()
        });
        console.log(`📤 ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('localhost:8000')) {
        apiLogs.push({
          type: 'RESPONSE',
          status: response.status(),
          url: response.url()
        });
        if (response.status() >= 400) {
          console.log(`🔴 ${response.status()} ${response.url()}`);
        } else {
          console.log(`📥 ${response.status()} ${response.url()}`);
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
        console.log(`❌ API FAILED: ${request.url()} - ${request.failure().errorText}`);
      }
    });
    
    // コンソールエラー監視
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Download the React DevTools')) {
        console.log(`🔴 JS ERROR: ${msg.text()}`);
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
      
      // 患者選択（Material-UI Select）
      console.log('\n=== 患者選択 ===');
      const patientSelect = page.locator('div:has-text("患者") + div').locator('[role="button"]');
      await patientSelect.click();
      await page.waitForTimeout(1000);
      
      const patientMenu = page.locator('[role="listbox"]');
      const patientOptions = patientMenu.locator('[role="option"]');
      const patientCount = await patientOptions.count();
      console.log(`📍 患者数: ${patientCount}`);
      
      if (patientCount > 0) {
        const firstPatient = patientOptions.first();
        const patientName = await firstPatient.textContent();
        console.log(`📍 選択患者: ${patientName}`);
        await firstPatient.click();
        await page.waitForTimeout(2000);
        console.log('✅ 患者選択完了');
        
        // 診療記録選択
        console.log('\n=== 診療記録選択 ===');
        const encounterSelect = page.locator('div:has-text("診療記録") + div').locator('[role="button"]');
        await encounterSelect.click();
        await page.waitForTimeout(1000);
        
        const encounterMenu = page.locator('[role="listbox"]');
        const encounterOptions = encounterMenu.locator('[role="option"]');
        const encounterCount = await encounterOptions.count();
        console.log(`📍 診療記録数: ${encounterCount}`);
        
        if (encounterCount > 0) {
          const firstEncounter = encounterOptions.first();
          const encounterName = await firstEncounter.textContent();
          console.log(`📍 選択診療記録: ${encounterName}`);
          await firstEncounter.click();
          await page.waitForTimeout(2000);
          console.log('✅ 診療記録選択完了');
          
          // 薬剤検索
          console.log('\n=== 薬剤検索 ===');
          const searchInput = page.locator('input[placeholder*="薬剤名"]');
          await searchInput.fill('アセトアミノフェン');
          await page.waitForTimeout(3000);
          
          const searchResults = await page.locator('table tbody tr').count();
          console.log(`📍 検索結果: ${searchResults}件`);
          
          if (searchResults > 0) {
            // 薬剤追加
            console.log('\n=== 薬剤追加 ===');
            const addButton = page.locator('table tbody button:has-text("追加")').first();
            await addButton.click();
            await page.waitForTimeout(2000);
            
            const prescriptionCount = await page.locator('text=/処方薬剤.*\\(\\d+件\\)/').textContent();
            console.log(`📍 ${prescriptionCount}`);
            console.log('✅ 薬剤追加完了');
            
            // 処方箋作成（メインテスト）
            console.log('\n=== 🚀 処方箋作成実行 🚀 ===');
            const createButton = page.locator('button:has-text("処方箋を作成")');
            const buttonExists = await createButton.isVisible();
            const buttonEnabled = await createButton.isEnabled();
            
            console.log(`📍 作成ボタン存在: ${buttonExists}, 有効: ${buttonEnabled}`);
            
            if (buttonExists && buttonEnabled) {
              // 作成前のAPIログ数
              const preCreateApiCount = apiLogs.length;
              
              console.log('🔥 処方箋作成ボタンをクリック！');
              await createButton.click();
              
              // 20秒待機して徹底的に監視
              console.log('⏳ 20秒間待機してAPI活動を監視...');
              await page.waitForTimeout(20000);
              
              // 作成後のAPIログ
              const postCreateApiLogs = apiLogs.slice(preCreateApiCount);
              console.log(`📊 作成時API呼び出し: ${postCreateApiLogs.length}件`);
              
              // UI状態確認
              const successVisible = await page.locator('text=処方箋が正常に作成されました').isVisible();
              const alertVisible = await page.locator('[role="alert"]').isVisible();
              const errorVisible = await page.locator('text=エラー').isVisible();
              
              console.log(`📍 UI状態: 成功=${successVisible}, アラート=${alertVisible}, エラー=${errorVisible}`);
              
              if (successVisible) {
                console.log('🎉 処方箋作成成功！');
              } else if (alertVisible) {
                const alertText = await page.locator('[role="alert"]').textContent();
                console.log(`❌ アラートメッセージ: ${alertText}`);
              } else if (errorVisible) {
                const errorText = await page.locator('text=エラー').textContent();
                console.log(`❌ エラーメッセージ: ${errorText}`);
              } else {
                console.log('⚠️ 成功・エラーメッセージが見つかりません');
              }
              
              // 詳細API呼び出しログ
              if (postCreateApiLogs.length > 0) {
                console.log('\n📋 作成時API詳細:');
                postCreateApiLogs.forEach((log, i) => {
                  if (log.type === 'REQUEST') {
                    console.log(`  ${i+1}. 📤 ${log.method} ${log.url}`);
                    if (log.body) {
                      console.log(`      📝 Body: ${log.body.substring(0, 300)}...`);
                    }
                  } else if (log.type === 'RESPONSE') {
                    const emoji = log.status >= 400 ? '🔴' : '📥';
                    console.log(`  ${i+1}. ${emoji} ${log.status} ${log.url}`);
                  } else if (log.type === 'FAILED') {
                    console.log(`  ${i+1}. ❌ ${log.url} - ${log.error}`);
                  }
                });
              } else {
                console.log('⚠️ 作成時にAPI呼び出しが発生していません');
              }
              
            } else {
              console.log('❌ 作成ボタンが使用できません');
            }
          } else {
            console.log('❌ 薬剤検索結果なし');
          }
        } else {
          console.log('❌ 診療記録なし');
        }
      } else {
        console.log('❌ 患者なし');
      }
      
    } catch (error) {
      console.log(`❌ テストエラー: ${error.message}`);
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'e2e-tests/prescription-final-real.png' });
    
    // 総API統計
    const totalAPI = apiLogs.length;
    const failedAPI = apiLogs.filter(log => log.type === 'FAILED').length;
    const errorAPI = apiLogs.filter(log => log.type === 'RESPONSE' && log.status >= 400).length;
    
    console.log(`\n📊 最終API統計:`);
    console.log(`  📤 総API呼び出し: ${totalAPI}件`);
    console.log(`  ❌ 失敗: ${failedAPI}件`);
    console.log(`  🔴 エラーレスポンス: ${errorAPI}件`);
    
    console.log('\n🎉 処方箋作成最終実テスト完了');
  });
});