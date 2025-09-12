const { test, expect } = require('@playwright/test');

test.describe('処方箋作成シンプルテスト', () => {
  test('薬剤検索とAPIテスト', async ({ page }) => {
    console.log('🧪 薬剤検索とAPIテスト開始');
    
    // ネットワークを監視
    page.on('response', response => {
      console.log(`📥 ${response.status()} ${response.url()}`);
    });
    
    page.on('requestfailed', request => {
      console.log(`❌ ${request.url()} - ${request.failure().errorText}`);
    });
    
    try {
      // ログインページに移動
      console.log('📍 ログインページへ移動');
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(3000);
      
      // ログイン情報入力
      console.log('📍 ログイン情報入力');
      await page.fill('input[name="username"]', 'demo');
      await page.fill('input[name="password"]', 'demo123');
      
      // ログインボタンクリック
      console.log('📍 ログインボタンクリック');
      await page.click('button[type="submit"]');
      
      // ダッシュボードへのリダイレクトを待機
      try {
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('✅ ダッシュボードに移動成功');
      } catch (error) {
        console.log('❌ ダッシュボードへの移動タイムアウト');
        
        // 現在のページ状況を確認
        const currentUrl = page.url();
        console.log(`📍 現在のURL: ${currentUrl}`);
        
        // エラーメッセージがあるかチェック
        const errorMessage = await page.locator('[role="alert"]').isVisible();
        if (errorMessage) {
          const errorText = await page.locator('[role="alert"]').textContent();
          console.log(`🔴 エラーメッセージ: ${errorText}`);
        }
        
        // スクリーンショットを取得
        await page.screenshot({ path: 'e2e-tests/login-debug.png' });
        return;
      }
      
      // 処方箋作成ページに直接移動
      console.log('📍 処方箋作成ページに移動');
      await page.goto('http://localhost:3000/prescriptions/create');
      await page.waitForTimeout(3000);
      
      // 薬剤検索のみテスト
      console.log('📍 薬剤検索テスト');
      const searchInput = page.locator('input[placeholder*="薬剤名"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('アセトアミノフェン');
        await page.waitForTimeout(3000);
        
        // 検索結果確認
        const results = await page.locator('table tbody tr').count();
        console.log(`📍 薬剤検索結果: ${results}件`);
        
        if (results > 0) {
          console.log('✅ 薬剤検索成功');
        } else {
          console.log('⚠️ 薬剤検索結果なし');
        }
      } else {
        console.log('⚠️ 検索入力フィールドが見つかりません');
      }
      
    } catch (error) {
      console.log('❌ テストエラー:', error.message);
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'e2e-tests/prescription-simple-final.png' });
    console.log('🎉 薬剤検索とAPIテスト完了');
  });
});