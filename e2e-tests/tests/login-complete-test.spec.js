const { test, expect } = require('@playwright/test');

test.describe('Complete Login Test', () => {
  test('should test complete login flow with detailed debugging', async ({ page }) => {
    let authToken = null;
    
    // リクエスト/レスポンスをキャプチャ
    page.on('request', request => {
      if (request.url().includes('/auth/')) {
        console.log(`\nREQUEST: ${request.method()} ${request.url()}`);
        if (request.postData()) {
          console.log('Body:', request.postData());
        }
      }
    });
    
    page.on('response', async response => {
      if (response.url().includes('/auth/')) {
        console.log(`RESPONSE: ${response.status()} ${response.url()}`);
        
        if (response.url().includes('/auth/login')) {
          try {
            const body = await response.json();
            console.log('Login response body:', body);
            if (body.access_token) {
              authToken = body.access_token;
              console.log('Token captured:', authToken.substring(0, 20) + '...');
            }
          } catch (e) {
            console.log('Failed to parse login response:', await response.text());
          }
        }
        
        if (response.url().includes('/auth/me')) {
          try {
            const body = await response.json();
            console.log('User info response:', body);
          } catch (e) {
            console.log('Failed to parse user info response:', await response.text());
          }
        }
      }
    });
    
    // エラーをキャプチャ
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console Error:', msg.text());
      }
    });
    
    // ログインページへ移動
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('\n=== Starting Login Test ===');
    
    // ログイン実行
    await page.fill('input[name="username"]', 'demo');
    await page.fill('input[name="password"]', 'demo123');
    
    await page.screenshot({ path: 'e2e-tests/login-before-submit.png' });
    
    await page.click('button[type="submit"]');
    
    // ログイン処理を待つ
    await page.waitForTimeout(5000);
    
    // 現在のURL確認
    const currentUrl = page.url();
    console.log('\nCurrent URL after login:', currentUrl);
    
    // LocalStorageの確認
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    console.log('LocalStorage contents:', localStorage);
    
    // エラーメッセージを確認
    const errorElements = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').all();
    if (errorElements.length > 0) {
      console.log('\nError messages found:');
      for (const element of errorElements) {
        const text = await element.textContent();
        console.log('  -', text);
      }
    }
    
    await page.screenshot({ path: 'e2e-tests/login-after-submit.png' });
    
    // もしログインに成功しているなら、手動でリダイレクト
    if (localStorage.access_token && currentUrl.includes('/login')) {
      console.log('\nToken exists but no redirect occurred. Attempting manual navigation...');
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForTimeout(2000);
      
      const dashboardUrl = page.url();
      console.log('Dashboard URL:', dashboardUrl);
      
      await page.screenshot({ path: 'e2e-tests/dashboard-after-manual-redirect.png' });
    }
  });
  
  test('should test API endpoints independently', async ({ request }) => {
    console.log('\n=== Testing API Endpoints ===');
    
    // 1. ログインテスト
    console.log('\n1. Testing login endpoint...');
    let token = null;
    try {
      const loginResponse = await request.post('http://localhost:8000/api/v1/auth/login', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          username: 'demo',
          password: 'demo123'
        }
      });
      
      console.log('Login Status:', loginResponse.status());
      if (loginResponse.ok()) {
        const loginBody = await loginResponse.json();
        token = loginBody.access_token;
        console.log('Login Success! Token:', token.substring(0, 20) + '...');
      } else {
        console.log('Login Failed:', await loginResponse.text());
        return;
      }
    } catch (error) {
      console.log('Login Error:', error.message);
      return;
    }
    
    // 2. ユーザー情報取得テスト
    console.log('\n2. Testing user info endpoint...');
    try {
      const userResponse = await request.get('http://localhost:8000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('User Info Status:', userResponse.status());
      if (userResponse.ok()) {
        const userBody = await userResponse.json();
        console.log('User Info Success:', userBody);
      } else {
        console.log('User Info Failed:', await userResponse.text());
      }
    } catch (error) {
      console.log('User Info Error:', error.message);
    }
    
    // 3. トークンテスト
    console.log('\n3. Testing token validation...');
    try {
      const tokenResponse = await request.post('http://localhost:8000/api/v1/auth/test-token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Token Test Status:', tokenResponse.status());
      if (tokenResponse.ok()) {
        const tokenBody = await tokenResponse.json();
        console.log('Token Test Success:', tokenBody);
      } else {
        console.log('Token Test Failed:', await tokenResponse.text());
      }
    } catch (error) {
      console.log('Token Test Error:', error.message);
    }
  });
});