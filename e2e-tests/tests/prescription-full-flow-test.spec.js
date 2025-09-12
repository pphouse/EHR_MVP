const { test, expect } = require('@playwright/test');

test.describe('処方箋作成完全フローテスト', () => {
  test('処方箋を実際に作成するまでの完全テスト', async ({ page }) => {
    console.log('🧪 処方箋作成完全フローテスト開始');
    
    // ネットワークリクエスト詳細監視
    const networkLogs = [];
    
    page.on('request', request => {
      networkLogs.push({
        type: 'REQUEST',
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        body: request.postData()
      });
      console.log(`📤 ${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      const log = {
        type: 'RESPONSE',
        status: response.status(),
        url: response.url(),
        headers: response.headers()
      };
      networkLogs.push(log);
      
      if (response.status() >= 400) {
        console.log(`🔴 ${response.status()} ${response.url()}`);
      } else {
        console.log(`📥 ${response.status()} ${response.url()}`);
      }
    });
    
    page.on('requestfailed', request => {
      console.log(`❌ ${request.url()} - ${request.failure().errorText}`);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 ブラウザエラー: ${msg.text()}`);
      }
    });
    
    try {
      // ステップ1: ログイン
      console.log('=== STEP 1: ログイン ===');
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(2000);
      
      await page.fill('input[name="username"]', 'demo');
      await page.fill('input[name="password"]', 'demo123');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✅ ログイン成功');
      
      // ステップ2: 処方箋作成ページ
      console.log('=== STEP 2: 処方箋作成ページへ移動 ===');
      await page.goto('http://localhost:3000/prescriptions/create');
      await page.waitForTimeout(3000);
      
      // ページタイトル確認
      const pageTitle = await page.locator('h4:has-text("新しい処方箋の作成")').isVisible();
      console.log(`📍 処方箋作成ページ表示: ${pageTitle}`);
      
      // ステップ3: 基本情報の確認
      console.log('=== STEP 3: 基本情報セクション確認 ===');
      const patientField = await page.locator('text=患者').isVisible();
      const encounterField = await page.locator('text=診療記録').isVisible();
      console.log(`📍 患者フィールド: ${patientField}, 診療記録フィールド: ${encounterField}`);
      
      // ステップ4: 薬剤検索
      console.log('=== STEP 4: 薬剤検索 ===');
      const searchInput = page.locator('input[placeholder*="薬剤名"]');
      await searchInput.fill('アセトアミノフェン');
      await page.waitForTimeout(3000);
      
      // 検索結果確認
      const resultRows = await page.locator('table tbody tr').count();
      console.log(`📍 検索結果: ${resultRows}件`);
      
      if (resultRows > 0) {
        // ステップ5: 薬剤追加
        console.log('=== STEP 5: 薬剤追加 ===');
        const addButton = page.locator('table tbody button:has-text("追加")').first();
        await addButton.click();
        await page.waitForTimeout(2000);
        
        // 追加結果確認
        const prescriptionCount = await page.locator('text=/処方薬剤.*\\(\\d+件\\)/').textContent();
        console.log(`📍 ${prescriptionCount}`);
        
        // ステップ6: 処方指示追加（任意）
        console.log('=== STEP 6: 処方指示追加 ===');
        const instructionsField = page.locator('textarea[placeholder*="処方指示"]');
        if (await instructionsField.isVisible()) {
          await instructionsField.fill('食後30分以内に服用してください。');
          console.log('📍 処方指示を入力');
        }
        
        // ステップ7: 処方箋作成ボタンクリック
        console.log('=== STEP 7: 処方箋作成ボタンクリック ===');
        const createButton = page.locator('button:has-text("処方箋を作成")');
        const isEnabled = await createButton.isEnabled();
        console.log(`📍 作成ボタン状態: ${isEnabled ? '有効' : '無効'}`);
        
        if (isEnabled) {
          // 作成ボタンクリック前のネットワーク状況記録
          const preClickRequests = networkLogs.length;
          console.log(`📍 作成前ネットワークログ数: ${preClickRequests}`);
          
          await createButton.click();
          console.log('📍 作成ボタンクリック完了');
          
          // 結果待機
          try {
            await page.waitForSelector('[role="alert"], text=処方箋が正常に作成されました, text=エラー', { timeout: 15000 });
            
            // 成功メッセージ確認
            const successVisible = await page.locator('text=処方箋が正常に作成されました').isVisible();
            const errorVisible = await page.locator('[role="alert"]').isVisible();
            
            if (successVisible) {
              console.log('✅ 処方箋作成成功！');
            } else if (errorVisible) {
              const errorText = await page.locator('[role="alert"]').textContent();
              console.log(`❌ 処方箋作成エラー: ${errorText}`);
            }
            
          } catch (waitError) {
            console.log('⚠️ 結果待機タイムアウト - 詳細調査中...');
            
            // 作成後のネットワーク状況確認
            const postClickRequests = networkLogs.length;
            console.log(`📍 作成後ネットワークログ数: ${postClickRequests}`);
            
            // 最新のネットワークリクエスト表示
            console.log('📊 最新のネットワークリクエスト:');
            networkLogs.slice(-10).forEach((log, index) => {
              if (log.type === 'REQUEST') {
                console.log(`  ${index}: ${log.method} ${log.url}`);
                if (log.body) {
                  console.log(`       Body: ${log.body.substring(0, 200)}...`);
                }
              } else {
                console.log(`  ${index}: ${log.status} ${log.url}`);
              }
            });
          }
        } else {
          console.log('❌ 作成ボタンが無効です');
        }
      } else {
        console.log('❌ 薬剤検索結果が0件です');
      }
      
    } catch (error) {
      console.log('❌ テスト実行エラー:', error.message);
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'e2e-tests/prescription-full-flow-final.png' });
    
    // ネットワークエラーサマリー
    const errorRequests = networkLogs.filter(log => 
      log.type === 'RESPONSE' && log.status >= 400
    );
    console.log(`📊 総ネットワークリクエスト: ${networkLogs.length}`);
    console.log(`📊 エラーレスポンス: ${errorRequests.length}`);
    
    if (errorRequests.length > 0) {
      console.log('🔴 エラー詳細:');
      errorRequests.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.status} ${err.url}`);
      });
    }
    
    console.log('🎉 処方箋作成完全フローテスト完了');
  });
});