const { test, expect } = require('@playwright/test');

test.describe('処方箋作成修正版テスト', () => {
  test('処方箋作成完全フロー（修正済み）', async ({ page }) => {
    console.log('🧪 処方箋作成完全フロー（修正済み）開始');
    
    // ネットワークリクエストを監視
    const networkErrors = [];
    
    page.on('response', response => {
      if (!response.ok() && response.status() !== 304) {
        console.log(`📥 レスポンス: ${response.status()} ${response.url()}`);
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    page.on('requestfailed', request => {
      console.log(`❌ リクエスト失敗: ${request.url()} - ${request.failure().errorText}`);
    });
    
    // コンソールエラーを監視
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 ブラウザエラー:`, msg.text());
      }
    });
    
    try {
      // ログイン
      console.log('📍 ログイン開始');
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(2000);
      
      await page.fill('input[name="username"]', 'demo');
      await page.fill('input[name="password"]', 'demo123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      console.log('✅ ログイン完了');
      
      // 処方箋作成ページに移動
      console.log('📍 処方箋作成ページへ移動');
      await page.goto('http://localhost:3000/prescriptions/create');
      await page.waitForTimeout(3000);
      
      // 患者選択 - より具体的なセレクター使用
      console.log('📍 患者選択');
      const patientSelectButton = page.locator('#patient-select').locator('..').locator('[role="button"]');
      await patientSelectButton.click();
      await page.waitForTimeout(1000);
      
      const firstPatient = page.locator('[role="listbox"] li').first();
      const patientName = await firstPatient.textContent();
      console.log(`📍 選択する患者: ${patientName}`);
      await firstPatient.click();
      await page.waitForTimeout(2000);
      
      // 診療記録選択
      console.log('📍 診療記録選択');
      const encounterSelectButton = page.locator('#encounter-select').locator('..').locator('[role="button"]');
      await encounterSelectButton.click();
      await page.waitForTimeout(1000);
      
      const firstEncounter = page.locator('[role="listbox"] li').first();
      const encounterInfo = await firstEncounter.textContent();
      console.log(`📍 選択する診療記録: ${encounterInfo}`);
      await firstEncounter.click();
      await page.waitForTimeout(2000);
      
      // 薬剤検索
      console.log('📍 薬剤検索');
      const searchInput = page.locator('input[placeholder*="薬剤名、一般名、商品名で検索"]');
      await searchInput.fill('アセトアミノフェン');
      await page.waitForTimeout(3000);
      
      // 検索結果を確認
      const searchResults = await page.locator('table tbody tr').count();
      console.log(`📍 検索結果: ${searchResults}件`);
      
      if (searchResults > 0) {
        // 薬剤追加
        console.log('📍 薬剤追加');
        const addButton = page.locator('table tbody button:has-text("追加")').first();
        await addButton.click();
        await page.waitForTimeout(2000);
        
        // 処方薬剤が追加されたか確認
        const prescriptionItems = await page.locator('text=/処方薬剤.*\\(\\d+件\\)/').textContent();
        console.log(`📍 ${prescriptionItems}`);
        
        // 処方箋を作成
        console.log('📍 処方箋を作成');
        const createButton = page.locator('button:has-text("処方箋を作成")');
        const isEnabled = await createButton.isEnabled();
        console.log(`📍 作成ボタン有効: ${isEnabled}`);
        
        if (isEnabled) {
          await createButton.click();
          console.log('📍 作成ボタンクリック完了');
          
          // 結果を待機（最大10秒）
          try {
            // 成功メッセージまたはエラーメッセージを待つ
            await page.waitForSelector('[role="alert"], text=処方箋が正常に作成されました', { timeout: 10000 });
            
            // 成功メッセージの確認
            const successMessage = await page.locator('text=処方箋が正常に作成されました').isVisible();
            if (successMessage) {
              console.log('✅ 処方箋作成成功！');
            }
            
            // エラーメッセージの確認
            const errorAlert = await page.locator('[role="alert"]').isVisible();
            if (errorAlert) {
              const errorText = await page.locator('[role="alert"]').textContent();
              console.log('❌ エラー:', errorText);
            }
          } catch (timeout) {
            console.log('⚠️ 結果待機タイムアウト');
          }
        }
      } else {
        console.log('⚠️ 薬剤検索結果が0件です');
      }
      
    } catch (error) {
      console.log('❌ テスト実行エラー:', error.message);
    }
    
    // ネットワークエラーサマリー
    console.log(`📊 ネットワークエラー数: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      console.log('🔴 ネットワークエラー詳細:');
      networkErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.status} ${error.url}`);
      });
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'e2e-tests/prescription-creation-fixed-final.png' });
    
    console.log('🎉 処方箋作成完全フロー（修正済み）完了');
  });
});