const { test, expect } = require('@playwright/test');

test.describe('処方箋作成ネットワークエラーデバッグ', () => {
  test('処方箋作成の完全フロー確認', async ({ page }) => {
    console.log('🧪 処方箋作成の完全フロー確認開始');
    
    // ネットワークリクエストを監視
    const networkRequests = [];
    const networkErrors = [];
    
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
      console.log(`📤 リクエスト: ${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      console.log(`📥 レスポンス: ${response.status()} ${response.url()}`);
      if (!response.ok()) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    page.on('requestfailed', request => {
      console.log(`❌ リクエスト失敗: ${request.url()} - ${request.failure().errorText}`);
      networkErrors.push({
        url: request.url(),
        error: request.failure().errorText
      });
    });
    
    // コンソールメッセージを監視
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 ブラウザエラー:`, msg.text());
      } else {
        console.log(`📍 ブラウザ [${msg.type()}]:`, msg.text());
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
      console.log('📍 ログイン完了');
      
      // 処方箋作成ページに移動
      console.log('📍 処方箋作成ページへ移動');
      await page.goto('http://localhost:3000/prescriptions/create');
      await page.waitForTimeout(3000);
      
      // 患者選択
      console.log('📍 患者選択');
      const patientSelect = page.locator('[aria-label="患者"] >> ..').locator('button');
      await patientSelect.click();
      await page.waitForTimeout(1000);
      
      const firstPatient = page.locator('[role="listbox"] >> li').first();
      await firstPatient.click();
      await page.waitForTimeout(2000);
      
      // 診療記録選択
      console.log('📍 診療記録選択');
      const encounterSelect = page.locator('[aria-label="診療記録"] >> ..').locator('button');
      await encounterSelect.click();
      await page.waitForTimeout(1000);
      
      const firstEncounter = page.locator('[role="listbox"] >> li').first();
      await firstEncounter.click();
      await page.waitForTimeout(2000);
      
      // 薬剤検索
      console.log('📍 薬剤検索');
      const searchInput = page.locator('input[placeholder*="薬剤名、一般名、商品名で検索"]');
      await searchInput.fill('アセトアミノフェン');
      await page.waitForTimeout(3000);
      
      // 薬剤追加
      console.log('📍 薬剤追加');
      const addButton = page.locator('table tbody button:has-text("追加")').first();
      await addButton.click();
      await page.waitForTimeout(2000);
      
      // 処方箋保存
      console.log('📍 処方箋保存');
      const saveButton = page.locator('button:has-text("処方箋を作成")');
      await saveButton.click();
      
      // 保存結果を待機
      await page.waitForTimeout(5000);
      
      // 成功メッセージまたはエラーメッセージを確認
      const successMessage = await page.locator('text=処方箋が正常に作成されました').isVisible();
      const errorMessage = await page.locator('[role="alert"]').isVisible();
      
      console.log('📍 成功メッセージ表示:', successMessage);
      console.log('📍 エラーメッセージ表示:', errorMessage);
      
      if (errorMessage) {
        const errorText = await page.locator('[role="alert"]').textContent();
        console.log('🔴 エラー内容:', errorText);
      }
      
    } catch (error) {
      console.log('❌ テスト実行エラー:', error.message);
    }
    
    // ネットワークエラーサマリー
    console.log('📊 ネットワークリクエスト数:', networkRequests.length);
    console.log('📊 ネットワークエラー数:', networkErrors.length);
    
    if (networkErrors.length > 0) {
      console.log('🔴 ネットワークエラー詳細:');
      networkErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.url} - ${error.status || error.error}`);
      });
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'e2e-tests/prescription-network-debug-final.png' });
    
    console.log('🎉 処方箋作成の完全フロー確認完了');
  });
});