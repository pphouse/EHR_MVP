const { test, expect } = require('@playwright/test');

test.describe('Login Form Debug', () => {
  test('should analyze login form elements', async ({ page }) => {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // すべての入力要素を探す
    const allInputs = await page.locator('input').all();
    console.log('Total inputs found:', allInputs.length);
    
    // 各入力要素の詳細を表示
    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`Input ${i + 1}: type="${type}", name="${name}", id="${id}", placeholder="${placeholder}"`);
    }
    
    // テキストフィールドを探す（Material-UIの場合）
    const textFields = await page.locator('[class*="MuiTextField"]').all();
    console.log('\nMUI TextFields found:', textFields.length);
    
    // ボタンを探す
    const buttons = await page.locator('button').all();
    console.log('\nButtons found:', buttons.length);
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const type = await buttons[i].getAttribute('type');
      console.log(`Button ${i + 1}: type="${type}", text="${text}"`);
    }
    
    // フォームを探す
    const forms = await page.locator('form').all();
    console.log('\nForms found:', forms.length);
    
    // 実際のログインテスト（ユーザー名フィールドを探す）
    try {
      // name属性で探す
      const usernameByName = await page.locator('input[name="username"]').count();
      console.log('\nUsername input by name:', usernameByName > 0);
      
      // IDで探す
      const usernameById = await page.locator('input#username').count();
      console.log('Username input by id:', usernameById > 0);
      
      // プレースホルダーで探す
      const usernameByPlaceholder = await page.locator('input[placeholder*="ユーザー名"]').count();
      console.log('Username input by placeholder:', usernameByPlaceholder > 0);
      
      // ラベルテキストで探す
      const usernameByLabel = await page.getByLabel(/ユーザー名/i).count();
      console.log('Username input by label:', usernameByLabel > 0);
      
      if (usernameByLabel > 0) {
        // ログインを試行
        await page.getByLabel(/ユーザー名/i).fill('demo@example.com');
        await page.getByLabel(/パスワード/i).fill('demo123');
        
        await page.screenshot({ path: 'e2e-tests/login-form-filled.png' });
        
        // サインインボタンをクリック
        await page.getByRole('button', { name: /サインイン/i }).click();
        
        // 結果を待つ
        await page.waitForTimeout(2000);
        
        // 結果のスクリーンショット
        await page.screenshot({ path: 'e2e-tests/login-result.png' });
        
        // エラーメッセージを確認
        const alerts = await page.locator('[role="alert"]').all();
        if (alerts.length > 0) {
          for (const alert of alerts) {
            const alertText = await alert.textContent();
            console.log('Alert message:', alertText);
          }
        }
        
        // ネットワークエラーメッセージを確認
        const errorMessages = await page.locator('text=/Network error/i').count();
        console.log('Network error messages found:', errorMessages);
      }
    } catch (error) {
      console.log('Error during login test:', error.message);
    }
  });
});