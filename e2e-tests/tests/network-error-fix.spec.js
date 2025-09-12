const { test, expect } = require('@playwright/test');

test.describe('Network Error Fix', () => {
  test('should identify and fix network error', async ({ page }) => {
    // ネットワークリクエストを詳細に記録
    const networkLogs = [];
    
    page.on('request', request => {
      networkLogs.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    });
    
    page.on('response', response => {
      networkLogs.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    });
    
    page.on('requestfailed', request => {
      networkLogs.push({
        type: 'failed',
        url: request.url(),
        failure: request.failure()
      });
    });

    // ログインページへ移動
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    // ログイン実行
    await page.fill('input[name="username"]', 'demo@example.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    
    // ネットワーク応答を待つ
    await page.waitForTimeout(3000);
    
    // ネットワークログを分析
    console.log('\n=== Network Logs ===');
    networkLogs.forEach(log => {
      if (log.url.includes('localhost:8000')) {
        console.log(`\n${log.type.toUpperCase()}: ${log.url}`);
        if (log.type === 'request') {
          console.log('Method:', log.method);
          if (log.postData) {
            console.log('Post Data:', log.postData);
          }
        } else if (log.type === 'response') {
          console.log('Status:', log.status, log.statusText);
        } else if (log.type === 'failed') {
          console.log('Failure:', log.failure);
        }
      }
    });
    
    // 現在のページ状態を確認
    const currentUrl = page.url();
    console.log('\nCurrent URL:', currentUrl);
    
    // エラーメッセージを探す
    const errorMessages = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').all();
    console.log('\nError elements found:', errorMessages.length);
    for (const msg of errorMessages) {
      const text = await msg.textContent();
      console.log('Error message:', text);
    }
    
    // ページのスクリーンショット
    await page.screenshot({ path: 'e2e-tests/network-error-debug.png' });
    
    // localStorage の内容を確認
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    console.log('\nLocalStorage:', localStorage);
  });
  
  test('should test API directly from backend', async ({ request }) => {
    // バックエンドAPIを直接テスト
    console.log('\n=== Direct API Test ===');
    
    // ログインエンドポイント
    try {
      const response = await request.post('http://localhost:8000/api/v1/auth/login', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        form: {
          username: 'demo@example.com',
          password: 'demo123'
        }
      });
      
      console.log('Login API Status:', response.status());
      const body = await response.json();
      console.log('Login API Response:', body);
      
      if (response.ok()) {
        console.log('Token received:', body.access_token ? 'Yes' : 'No');
      }
    } catch (error) {
      console.log('Login API Error:', error.message);
    }
    
    // ヘルスチェック
    try {
      const healthResponse = await request.get('http://localhost:8000/');
      console.log('\nRoot endpoint status:', healthResponse.status());
    } catch (error) {
      console.log('Health check error:', error.message);
    }
    
    // Docsエンドポイント
    try {
      const docsResponse = await request.get('http://localhost:8000/docs');
      console.log('Docs endpoint status:', docsResponse.status());
    } catch (error) {
      console.log('Docs error:', error.message);
    }
  });
});