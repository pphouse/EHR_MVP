const { test, expect } = require('@playwright/test');

test.describe('ページ内容の確認', () => {
  test('フロントエンドの実際の内容を確認', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // ページタイトルを取得
    const title = await page.title();
    console.log('ページタイトル:', title);
    
    // ページの内容を取得
    const content = await page.textContent('body');
    console.log('ページ内容:', content.substring(0, 200));
    
    // HTMLも確認
    const html = await page.innerHTML('body');
    console.log('HTML:', html.substring(0, 500));
    
    // スクリーンショットを保存
    await page.screenshot({ path: 'frontend-current-state.png', fullPage: true });
    
    console.log('スクリーンショットを保存しました: frontend-current-state.png');
  });

  test('バックエンドAPIの実際の内容を確認', async ({ page }) => {
    await page.goto('http://localhost:8000/docs');
    
    // ページタイトルを取得
    const title = await page.title();
    console.log('APIページタイトル:', title);
    
    // ページの内容を取得
    const content = await page.textContent('body');
    console.log('APIページ内容:', content.substring(0, 200));
    
    // スクリーンショットを保存
    await page.screenshot({ path: 'backend-current-state.png', fullPage: true });
    
    console.log('APIスクリーンショットを保存しました: backend-current-state.png');
  });
});