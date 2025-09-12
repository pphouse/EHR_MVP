const { test, expect } = require('@playwright/test');

test.describe('処方箋作成ネットワークエラー最終テスト', () => {
  test('処方箋作成で実際にネットワークエラーが起こるかテスト', async ({ page }) => {
    console.log('🧪 処方箋作成ネットワークエラー最終テスト開始');
    
    // 全ネットワーク監視
    const networkLog = [];
    
    page.on('request', request => {
      networkLog.push({ type: 'REQUEST', method: request.method(), url: request.url(), timestamp: Date.now() });
      console.log(`📤 ${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      networkLog.push({ type: 'RESPONSE', status: response.status(), url: response.url(), timestamp: Date.now() });
      if (response.status() >= 400) {
        console.log(`🔴 ${response.status()} ${response.url()}`);
      } else {
        console.log(`📥 ${response.status()} ${response.url()}`);
      }
    });
    
    page.on('requestfailed', request => {
      networkLog.push({ type: 'FAILED', url: request.url(), error: request.failure().errorText, timestamp: Date.now() });
      console.log(`❌ NETWORK FAILED: ${request.url()} - ${request.failure().errorText}`);
    });
    
    try {
      // ログイン
      console.log('\n=== ログイン ===');
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(2000);
      
      await page.fill('input[name="username"]', 'demo');
      await page.fill('input[name="password"]', 'demo123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      console.log('✅ ログイン完了');
      
      // 処方箋作成ページ
      console.log('\n=== 処方箋作成ページ ===');
      await page.goto('http://localhost:3000/prescriptions/create');
      await page.waitForTimeout(3000);
      
      // 患者選択（正確なセレクター）
      console.log('\n=== 患者選択 ===');
      const patientDropdown = page.locator('[role="button"][aria-haspopup="listbox"]').first();
      await patientDropdown.click();
      await page.waitForTimeout(1000);
      
      const patientList = page.locator('[role="listbox"]');
      const patientOptions = patientList.locator('li');
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
        console.log('\n=== 診療記録選択 ===');
        const encounterDropdown = page.locator('[role="button"][aria-haspopup="listbox"]').nth(1);
        await encounterDropdown.click();
        await page.waitForTimeout(1000);
        
        const encounterOptions = page.locator('[role="listbox"] li');
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
            await page.waitForTimeout(3000);
            
            // 処方薬剤確認
            const prescriptionText = await page.locator('text=/処方薬剤.*\\(\\d+件\\)/').textContent();
            console.log(`📍 ${prescriptionText}`);
            
            // ★★★ 処方箋作成実行 ★★★
            console.log('\n=== 処方箋作成実行 ===');
            const createButton = page.locator('button:has-text("処方箋を作成")');
            const buttonEnabled = await createButton.isEnabled();
            console.log(`📍 作成ボタン有効: ${buttonEnabled}`);
            
            if (buttonEnabled) {
              // ネットワークログクリア（作成時のみフォーカス）
              const preCreateLogCount = networkLog.length;
              
              console.log('🚀 処方箋作成ボタンクリック！');
              await createButton.click();
              
              // 15秒待機して結果確認
              console.log('⏳ 15秒待機中...');
              await page.waitForTimeout(15000);
              
              // 作成後のネットワークログ
              const postCreateLogs = networkLog.slice(preCreateLogCount);
              console.log(`📊 作成時ネットワーク活動: ${postCreateLogs.length}件`);
              
              // 成功・エラーメッセージ確認
              const successVisible = await page.locator('text=処方箋が正常に作成されました').isVisible();
              const alertVisible = await page.locator('[role="alert"]').isVisible();
              
              if (successVisible) {
                console.log('🎉 処方箋作成成功！');
              } else if (alertVisible) {
                const alertText = await page.locator('[role="alert"]').textContent();
                console.log(`❌ エラーメッセージ: ${alertText}`);
              } else {
                console.log('⚠️ 成功・エラーメッセージなし');
              }
              
              // 詳細ネットワークログ
              if (postCreateLogs.length > 0) {
                console.log('\n📋 作成時ネットワーク詳細:');
                postCreateLogs.forEach((log, i) => {
                  if (log.type === 'REQUEST') {
                    console.log(`  ${i+1}. 📤 ${log.method} ${log.url}`);
                  } else if (log.type === 'RESPONSE') {
                    const status = log.status >= 400 ? '🔴' : '📥';
                    console.log(`  ${i+1}. ${status} ${log.status} ${log.url}`);
                  } else if (log.type === 'FAILED') {
                    console.log(`  ${i+1}. ❌ FAILED ${log.url} - ${log.error}`);
                  }
                });
              }
            } else {
              console.log('❌ 作成ボタンが無効です');
            }
          } else {
            console.log('❌ 薬剤検索結果なし');
          }
        } else {
          console.log('❌ 診療記録なし');
        }
      } else {
        console.log('❌ 患者データなし');
      }
      
    } catch (error) {
      console.log(`❌ テストエラー: ${error.message}`);
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'e2e-tests/prescription-network-final.png' });
    
    // 総ネットワーク統計
    const totalRequests = networkLog.filter(log => log.type === 'REQUEST').length;
    const totalResponses = networkLog.filter(log => log.type === 'RESPONSE').length;
    const totalErrors = networkLog.filter(log => log.type === 'FAILED' || (log.type === 'RESPONSE' && log.status >= 400)).length;
    
    console.log(`\n📊 総ネットワーク統計:`);
    console.log(`  📤 リクエスト: ${totalRequests}件`);
    console.log(`  📥 レスポンス: ${totalResponses}件`);
    console.log(`  ❌ エラー: ${totalErrors}件`);
    
    console.log('\n🎉 処方箋作成ネットワークエラー最終テスト完了');
  });
});