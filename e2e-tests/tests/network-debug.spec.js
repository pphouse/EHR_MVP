const { test, expect } = require('@playwright/test');

test.describe('Network Debug', () => {
  test('should check console errors and network requests', async ({ page }) => {
    // コンソールエラーを記録
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // ネットワークリクエストを記録
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()
      });
    });

    // APIレスポンスを記録
    const apiResponses = [];
    page.on('response', response => {
      if (response.url().includes('localhost:8000')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // フロントエンドにアクセス
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // ログイン画面のスクリーンショット
    await page.screenshot({ path: 'e2e-tests/network-debug-login.png' });

    // コンソールエラーを表示
    if (consoleErrors.length > 0) {
      console.log('Console Errors:');
      consoleErrors.forEach(error => console.log('  -', error));
    }

    // 失敗したリクエストを表示
    if (failedRequests.length > 0) {
      console.log('\nFailed Requests:');
      failedRequests.forEach(req => {
        console.log('  - URL:', req.url);
        console.log('    Failure:', req.failure);
      });
    }

    // APIレスポンスを表示
    console.log('\nAPI Responses:');
    apiResponses.forEach(res => {
      console.log(`  - ${res.status} ${res.statusText}: ${res.url}`);
    });

    // ログインを試みる
    await page.fill('input[type="email"]', 'john.doe@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // ネットワークエラーのスクリーンショット
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e-tests/network-debug-error.png' });

    // エラーメッセージを確認
    const errorMessage = await page.textContent('body');
    if (errorMessage.includes('Network error')) {
      console.log('\nNetwork error message found on page');
    }
  });

  test('should test API directly', async ({ request }) => {
    // API直接テスト
    try {
      const response = await request.get('http://localhost:8000/api/v1/health');
      console.log('Health check status:', response.status());
      if (!response.ok()) {
        console.log('Response body:', await response.text());
      }
    } catch (error) {
      console.log('Health check error:', error.message);
    }

    // ログインエンドポイントをテスト
    try {
      const loginResponse = await request.post('http://localhost:8000/api/v1/auth/login', {
        data: {
          username: 'john.doe@example.com',
          password: 'password123'
        }
      });
      console.log('\nLogin endpoint status:', loginResponse.status());
      const loginBody = await loginResponse.text();
      console.log('Login response:', loginBody);
    } catch (error) {
      console.log('Login error:', error.message);
    }
  });

  test('should check CORS headers', async ({ request }) => {
    try {
      const response = await request.options('http://localhost:8000/api/v1/auth/login', {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type'
        }
      });
      
      console.log('CORS preflight status:', response.status());
      console.log('CORS headers:');
      const headers = response.headers();
      Object.keys(headers).forEach(key => {
        if (key.toLowerCase().includes('access-control')) {
          console.log(`  ${key}: ${headers[key]}`);
        }
      });
    } catch (error) {
      console.log('CORS check error:', error.message);
    }
  });
});