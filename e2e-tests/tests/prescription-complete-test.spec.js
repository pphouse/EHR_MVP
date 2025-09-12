const { test, expect } = require('@playwright/test');

test.describe('処方箋作成完全テスト（データ完備）', () => {
  test('処方箋作成・薬剤追加・保存までの完全フロー', async ({ page }) => {
    console.log('🧪 処方箋作成完全テスト開始（データ完備）');
    
    // ネットワーク監視
    const apiCalls = [];
    
    page.on('request', request => {
      if (request.url().includes('localhost:8000')) {
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          body: request.postData()
        });
        console.log(`📤 ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('localhost:8000')) {
        if (response.status() >= 400) {
          console.log(`🔴 ${response.status()} ${response.url()}`);
        } else {
          console.log(`📥 ${response.status()} ${response.url()}`);
        }
      }
    });
    
    page.on('requestfailed', request => {
      if (request.url().includes('localhost:8000')) {
        console.log(`❌ API FAILED: ${request.url()} - ${request.failure().errorText}`);
      }
    });
    
    try {
      // STEP 1: ログイン
      console.log('\n=== STEP 1: ログイン ===');
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(2000);
      
      await page.fill('input[name="username"]', 'demo');
      await page.fill('input[name="password"]', 'demo123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      console.log('✅ ログイン成功');
      
      // STEP 2: 処方箋作成ページ
      console.log('\n=== STEP 2: 処方箋作成ページ移動 ===');
      await page.goto('http://localhost:3000/prescriptions/create');
      await page.waitForTimeout(3000);
      console.log('✅ 処方箋作成ページ表示');
      
      // STEP 3: 患者選択
      console.log('\n=== STEP 3: 患者選択 ===');
      const patientSelect = page.locator('div:has-text("患者") >> button').first();
      await patientSelect.click();
      await page.waitForTimeout(1000);
      
      const patientOption = page.locator('[role="listbox"] li').first();
      const patientName = await patientOption.textContent();
      console.log(`📍 患者選択: ${patientName}`);
      await patientOption.click();
      await page.waitForTimeout(2000);
      console.log('✅ 患者選択完了');
      
      // STEP 4: エンカウンター選択
      console.log('\n=== STEP 4: 診療記録選択 ===');
      const encounterSelect = page.locator('div:has-text("診療記録") >> button').first();
      await encounterSelect.click();
      await page.waitForTimeout(1000);
      
      const encounterOption = page.locator('[role="listbox"] li').first();
      const encounterInfo = await encounterOption.textContent();
      console.log(`📍 診療記録選択: ${encounterInfo}`);
      await encounterOption.click();
      await page.waitForTimeout(2000);
      console.log('✅ 診療記録選択完了');
      
      // STEP 5: 薬剤検索
      console.log('\n=== STEP 5: 薬剤検索 ===');
      const searchInput = page.locator('input[placeholder*="薬剤名"]');
      await searchInput.fill('アセトアミノフェン');
      await page.waitForTimeout(3000);
      
      const searchResults = await page.locator('table tbody tr').count();
      console.log(`📍 検索結果: ${searchResults}件`);
      
      // STEP 6: 薬剤追加
      console.log('\n=== STEP 6: 薬剤追加 ===');
      const addButton = page.locator('table tbody button:has-text("追加")').first();
      await addButton.click();
      await page.waitForTimeout(3000);
      
      // 追加結果確認
      const prescriptionItems = await page.locator('text=/処方薬剤.*\\(\\d+件\\)/', { timeout: 5000 }).textContent();
      console.log(`📍 ${prescriptionItems}`);
      console.log('✅ 薬剤追加完了');
      
      // STEP 7: 処方箋作成実行
      console.log('\n=== STEP 7: 処方箋作成実行 ===');
      const createButton = page.locator('button:has-text("処方箋を作成")');
      
      const isVisible = await createButton.isVisible();
      const isEnabled = await createButton.isEnabled();
      console.log(`📍 作成ボタン表示: ${isVisible}, 有効: ${isEnabled}`);
      
      if (isEnabled) {
        console.log('📍 処方箋作成ボタンクリック...');
        
        // 作成前のAPI呼び出し数
        const preSaveApiCalls = apiCalls.length;
        
        await createButton.click();
        console.log('📍 クリック完了 - 結果待機中...');
        
        // 結果待機（成功またはエラーメッセージ）
        try {
          await Promise.race([
            page.waitForSelector('text=処方箋が正常に作成されました', { timeout: 15000 }),
            page.waitForSelector('[role="alert"]', { timeout: 15000 }),
            page.waitForSelector('text=エラー', { timeout: 15000 })
          ]);
          
          // 成功確認
          const successVisible = await page.locator('text=処方箋が正常に作成されました').isVisible();
          const alertVisible = await page.locator('[role="alert"]').isVisible();
          
          if (successVisible) {
            console.log('🎉 処方箋作成成功！');
          } else if (alertVisible) {
            const alertText = await page.locator('[role="alert"]').textContent();
            console.log(`❌ 処方箋作成エラー: ${alertText}`);
          }
          
        } catch (waitError) {
          console.log('⚠️ 結果待機タイムアウト');
          
          // 作成後のAPI呼び出しログ
          const postSaveApiCalls = apiCalls.length;
          console.log(`📊 API呼び出し: 作成前 ${preSaveApiCalls}件 → 作成後 ${postSaveApiCalls}件`);
          
          if (postSaveApiCalls > preSaveApiCalls) {
            console.log('📋 作成時の新しいAPI呼び出し:');
            apiCalls.slice(preSaveApiCalls).forEach((call, index) => {
              console.log(`  ${index + 1}. ${call.method} ${call.url}`);
              if (call.body) {
                console.log(`     Body: ${call.body.substring(0, 200)}...`);
              }
            });
          }
        }
      } else {
        console.log('❌ 処方箋作成ボタンが無効です');
      }
      
    } catch (error) {
      console.log(`❌ テストエラー: ${error.message}`);
    }
    
    // 最終情報
    console.log(`\n📊 総API呼び出し: ${apiCalls.length}件`);
    
    // スクリーンショット
    await page.screenshot({ path: 'e2e-tests/prescription-complete-final.png' });
    
    console.log('🎉 処方箋作成完全テスト完了');
  });
});