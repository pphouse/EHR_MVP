const { test, expect } = require('@playwright/test');

test.describe('アプリケーション起動確認', () => {
  test('フロントエンドが正しく表示される', async ({ page }) => {
    // フロントエンドにアクセス
    await page.goto('http://localhost:3000');
    
    // ページのタイトルを確認
    await expect(page).toHaveTitle(/EHR MVP/);
    
    // ログイン画面が表示されることを確認
    await expect(page.locator('text=ログイン')).toBeVisible();
    
    console.log('フロントエンドが正常に起動しています');
  });

  test('バックエンドAPIが正しく応答する', async ({ page }) => {
    // API ドキュメントにアクセス
    await page.goto('http://localhost:8000/docs');
    
    // Swagger UIが表示されることを確認
    await expect(page.locator('text=FastAPI')).toBeVisible();
    
    console.log('バックエンドAPIが正常に起動しています');
  });

  test('ログイン画面の要素が正しく表示される', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // 必要な要素が存在することを確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('ログイン画面の要素が正しく表示されています');
  });
});