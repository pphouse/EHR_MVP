const { test, expect } = require('@playwright/test');

test.describe('Login Test', () => {
  test('should display login page and authenticate', async ({ page }) => {
    // ネットワークログを有効化
    page.on('request', request => {
      if (request.url().includes('auth/login')) {
        console.log('Login request:', request.method(), request.url());
        console.log('Request headers:', request.headers());
      }
    });

    page.on('response', response => {
      if (response.url().includes('auth/login')) {
        console.log('Login response:', response.status(), response.statusText());
      }
    });

    // コンソールログを記録
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    // ログインページにアクセス
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // ページのスクリーンショット
    await page.screenshot({ path: 'e2e-tests/login-page.png' });

    // ログインフォームが表示されているか確認
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    
    console.log('Email input found:', emailInput > 0);
    console.log('Password input found:', passwordInput > 0);

    if (emailInput > 0 && passwordInput > 0) {
      // ログイン情報を入力
      await page.fill('input[type="email"]', 'demo@example.com');
      await page.fill('input[type="password"]', 'demo123');
      
      // ログインボタンをクリック
      await page.click('button[type="submit"]');
      
      // レスポンスを待つ
      await page.waitForTimeout(3000);
      
      // ログイン後のスクリーンショット
      await page.screenshot({ path: 'e2e-tests/after-login.png' });
      
      // URLを確認
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);
      
      // エラーメッセージを確認
      const errorText = await page.textContent('body');
      if (errorText.includes('Network error')) {
        console.log('Network error detected');
        
        // APIエンドポイントを直接確認
        try {
          const apiResponse = await page.evaluate(async () => {
            const response = await fetch('http://localhost:8000/api/v1/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                username: 'demo@example.com',
                password: 'demo123'
              })
            });
            return {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries())
            };
          });
          console.log('Direct API test:', apiResponse);
        } catch (error) {
          console.log('Direct API error:', error.message);
        }
      }
    } else {
      console.log('Login form not found on page');
      
      // ページの内容を確認
      const pageContent = await page.textContent('body');
      console.log('Page content:', pageContent.substring(0, 500));
    }
  });

  test('should check if application is redirecting correctly', async ({ page }) => {
    // ルートにアクセス
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // リダイレクト後のURLを確認
    const url = page.url();
    console.log('Root URL redirects to:', url);
    
    // スクリーンショット
    await page.screenshot({ path: 'e2e-tests/root-redirect.png' });
  });
});