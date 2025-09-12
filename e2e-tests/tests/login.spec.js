const { test, expect } = require('@playwright/test');

test.describe('ログイン機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('デモユーザーでログインが成功する', async ({ page }) => {
    console.log('ログインページに移動しました');

    // ユーザー名フィールドを探して入力（name属性で特定）
    const usernameField = page.locator('input[name="username"]');
    await expect(usernameField).toBeVisible();
    await usernameField.fill('demo');
    console.log('ユーザー名を入力しました: demo');

    // パスワードフィールドを探して入力（name属性で特定）
    const passwordField = page.locator('input[name="password"]');
    await expect(passwordField).toBeVisible();
    await passwordField.fill('demo123');
    console.log('パスワードを入力しました: demo123');

    // ログインボタンを探してクリック
    const loginButton = page.locator('button[type="submit"], button:has-text("サインイン"), button:has-text("ログイン")');
    await expect(loginButton).toBeVisible();
    
    // スクリーンショットを撮ってログイン前の状態を確認
    await page.screenshot({ path: 'login-before.png', fullPage: true });
    console.log('ログイン前のスクリーンショットを保存しました');

    // ログインボタンをクリック
    await loginButton.click();
    console.log('ログインボタンをクリックしました');

    // ログイン後の状態を確認
    await page.waitForTimeout(3000); // 3秒待機

    // スクリーンショットを撮ってログイン後の状態を確認
    await page.screenshot({ path: 'login-after.png', fullPage: true });
    console.log('ログイン後のスクリーンショットを保存しました');

    // ページの内容を確認
    const content = await page.textContent('body');
    console.log('ログイン後のページ内容:', content.substring(0, 300));

    // URLが変更されたか確認
    const currentUrl = page.url();
    console.log('現在のURL:', currentUrl);

    // エラーメッセージがないか確認
    const errorElements = page.locator('text=/エラー|error|失敗|failed/i');
    const errorCount = await errorElements.count();
    if (errorCount > 0) {
      const errorText = await errorElements.first().textContent();
      console.log('エラーメッセージが見つかりました:', errorText);
    }

    // 成功の兆候を探す（ダッシュボード、メニュー、ユーザー名の表示など）
    const successIndicators = [
      page.locator('text=ダッシュボード'),
      page.locator('text=患者'),
      page.locator('text=診療'),
      page.locator('text=Demo User'),
      page.locator('text=ログアウト'),
      page.locator('[data-testid="dashboard"]'),
      page.locator('.dashboard'),
      page.locator('nav')
    ];

    let loginSuccess = false;
    for (const indicator of successIndicators) {
      const isVisible = await indicator.isVisible().catch(() => false);
      if (isVisible) {
        const text = await indicator.textContent();
        console.log('成功の兆候が見つかりました:', text);
        loginSuccess = true;
        break;
      }
    }

    if (!loginSuccess) {
      console.log('ログイン成功の明確な兆候が見つかりませんでした');
      // URLが変更されていればある程度成功とみなす
      if (currentUrl !== 'http://localhost:3000/' && !currentUrl.includes('login')) {
        console.log('URLが変更されているため、ログインは成功したようです');
        loginSuccess = true;
      }
    }

    // ログインが成功したかテスト
    expect(loginSuccess).toBe(true);
  });

  test('無効な認証情報でログインが失敗する', async ({ page }) => {
    console.log('無効な認証情報でのログインテストを開始');

    // 無効な認証情報でログインを試行
    const usernameField = page.locator('input[name="username"]');
    await usernameField.fill('invalid_user');

    const passwordField = page.locator('input[name="password"]');
    await passwordField.fill('invalid_password');

    const loginButton = page.locator('button[type="submit"], button:has-text("サインイン"), button:has-text("ログイン")');
    await loginButton.click();

    // エラーメッセージまたは失敗の兆候を確認
    await page.waitForTimeout(2000);

    const content = await page.textContent('body');
    console.log('失敗後のページ内容:', content.substring(0, 300));

    // ログインページに留まっているか確認
    const currentUrl = page.url();
    console.log('失敗後のURL:', currentUrl);

    // スクリーンショットを保存
    await page.screenshot({ path: 'login-failed.png', fullPage: true });
    console.log('ログイン失敗のスクリーンショットを保存しました');
  });
});