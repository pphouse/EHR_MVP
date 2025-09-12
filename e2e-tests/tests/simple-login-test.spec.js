import { test, expect } from '@playwright/test';

test.describe('簡単ログインテスト', () => {
  test('ログイン画面の表示とAPIレスポンス確認', async ({ page }) => {
    // ネットワークリクエストをキャプチャ
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
    });
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    });

    // ログインページにアクセス
    await page.goto('http://localhost:3000');
    
    // ログインフォームの存在確認
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // ユーザー名とパスワードを入力
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    
    // ログインボタンをクリック
    await page.locator('button[type="submit"]').click();
    
    // 少し待機してレスポンスを確認
    await page.waitForTimeout(3000);
    
    // ネットワークリクエストとレスポンスをログ出力
    console.log('--- リクエスト一覧 ---');
    requests.forEach(req => {
      if (req.url.includes('login') || req.url.includes('auth')) {
        console.log(`${req.method} ${req.url}`);
        if (req.postData) {
          console.log('POST Data:', req.postData);
        }
      }
    });
    
    console.log('--- レスポンス一覧 ---');
    responses.forEach(res => {
      if (res.url.includes('login') || res.url.includes('auth')) {
        console.log(`${res.status} ${res.statusText} - ${res.url}`);
      }
    });
    
    // 現在のURLを確認
    const currentUrl = page.url();
    console.log('現在のURL:', currentUrl);
    
    // ページコンテンツを確認
    const pageContent = await page.locator('body').textContent();
    if (pageContent.includes('Not Found') || pageContent.includes('エラー')) {
      console.log('エラーメッセージが表示されています');
      
      // エラーメッセージの詳細を取得
      const errorAlert = page.locator('[role="alert"]');
      if (await errorAlert.isVisible()) {
        const errorText = await errorAlert.textContent();
        console.log('エラー詳細:', errorText);
      }
    }
    
    // スクリーンショットを保存（デバッグ用）
    await page.screenshot({ path: '/Users/naoto/EHR_MVP/e2e-tests/login-debug.png', fullPage: true });
    console.log('デバッグ用スクリーンショットを保存しました: /Users/naoto/EHR_MVP/e2e-tests/login-debug.png');
  });
});