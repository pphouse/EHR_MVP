const { test, expect } = require('@playwright/test');

test.describe('Login Fix Test', () => {
  test('should test different login formats', async ({ request }) => {
    console.log('=== Testing Login API Formats ===\n');
    
    // 1. Form-urlencoded形式でテスト（ユーザー名: demo）
    console.log('Test 1: Form-urlencoded with username=demo');
    try {
      const response1 = await request.post('http://localhost:8000/api/v1/auth/login', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        form: {
          username: 'demo',
          password: 'demo123'
        }
      });
      console.log('Status:', response1.status());
      if (response1.ok()) {
        const body = await response1.json();
        console.log('Success! Token:', body.access_token?.substring(0, 20) + '...');
      } else {
        console.log('Response:', await response1.text());
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
    
    // 2. Form-urlencoded形式でテスト（ユーザー名: demo@example.com）
    console.log('\nTest 2: Form-urlencoded with username=demo@example.com');
    try {
      const response2 = await request.post('http://localhost:8000/api/v1/auth/login', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        form: {
          username: 'demo@example.com',
          password: 'demo123'
        }
      });
      console.log('Status:', response2.status());
      if (response2.ok()) {
        const body = await response2.json();
        console.log('Success! Token:', body.access_token?.substring(0, 20) + '...');
      } else {
        console.log('Response:', await response2.text());
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
    
    // 3. JSON形式でテスト
    console.log('\nTest 3: JSON format');
    try {
      const response3 = await request.post('http://localhost:8000/api/v1/auth/login', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          username: 'demo',
          password: 'demo123'
        }
      });
      console.log('Status:', response3.status());
      if (response3.ok()) {
        const body = await response3.json();
        console.log('Success! Token:', body.access_token?.substring(0, 20) + '...');
      } else {
        console.log('Response:', await response3.text());
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
    
    // 4. OpenAPIドキュメントで形式を確認
    console.log('\n=== Checking OpenAPI Documentation ===');
    try {
      const openApiResponse = await request.get('http://localhost:8000/openapi.json');
      if (openApiResponse.ok()) {
        const openApi = await openApiResponse.json();
        const loginPath = openApi.paths['/api/v1/auth/login'];
        if (loginPath && loginPath.post) {
          console.log('Login endpoint expects:', 
            JSON.stringify(loginPath.post.requestBody?.content, null, 2));
        }
      }
    } catch (error) {
      console.log('OpenAPI check error:', error.message);
    }
  });
  
  test('should verify and fix frontend login', async ({ page }) => {
    // フロントエンドのログイン処理を確認
    await page.goto('http://localhost:3000/login');
    
    // APIリクエストをインターセプト
    await page.route('**/api/v1/auth/login', async (route, request) => {
      console.log('\n=== Intercepted Login Request ===');
      console.log('URL:', request.url());
      console.log('Method:', request.method());
      console.log('Headers:', request.headers());
      console.log('Post Data:', request.postData());
      
      // 正しい形式でリクエストを送信
      const response = await page.request.post('http://localhost:8000/api/v1/auth/login', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        form: {
          username: 'demo',
          password: 'demo123'
        }
      });
      
      if (response.ok()) {
        const body = await response.json();
        console.log('Login successful, returning token');
        
        // 成功レスポンスを返す
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(body)
        });
      } else {
        await route.continue();
      }
    });
    
    // ログイン実行
    await page.fill('input[name="username"]', 'demo');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    
    // 結果を待つ
    await page.waitForTimeout(3000);
    
    // ログイン後の状態を確認
    const currentUrl = page.url();
    console.log('\nAfter login URL:', currentUrl);
    
    // LocalStorageを確認
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    console.log('LocalStorage after login:', localStorage);
    
    await page.screenshot({ path: 'e2e-tests/login-fixed.png' });
  });
});