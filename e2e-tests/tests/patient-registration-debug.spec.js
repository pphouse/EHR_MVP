import { test, expect } from '@playwright/test';

test.describe('患者登録機能デバッグテスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログインページに移動
    await page.goto('http://localhost:3000');
    
    // ログイン
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    
    // ダッシュボードページの確認
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
  });

  test('患者登録機能の詳細テスト', async ({ page }) => {
    console.log('患者登録機能のデバッグ開始');
    
    // ネットワークリクエストの監視
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

    // 患者管理ページに移動
    await page.goto('http://localhost:3000/patients');
    await expect(page).toHaveURL('http://localhost:3000/patients');
    
    // 現在の患者一覧を確認
    await page.waitForTimeout(2000);
    const patientListBefore = await page.locator('[data-testid="patient-row"], .patient-item, tr').count();
    console.log('登録前の患者数:', patientListBefore);
    
    // 新規患者登録ボタンの確認
    const newPatientButton = page.getByRole('button', { name: /新規患者登録|患者登録|新規登録/ });
    await expect(newPatientButton).toBeVisible();
    
    // 患者登録ページに移動
    await newPatientButton.click();
    await expect(page).toHaveURL('http://localhost:3000/patients/create');
    
    // フォームの確認
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    
    // フォームに必要なデータを入力
    const testPatient = {
      lastName: 'テスト',
      firstName: '太郎',
      lastNameKana: 'テスト',
      firstNameKana: 'タロウ',
      phone: '090-1234-5678',
      dateOfBirth: '1990-01-01'
    };
    
    await page.locator('input[name="lastName"]').fill(testPatient.lastName);
    await page.locator('input[name="firstName"]').fill(testPatient.firstName);
    await page.locator('input[name="lastNameKana"]').fill(testPatient.lastNameKana);
    await page.locator('input[name="firstNameKana"]').fill(testPatient.firstNameKana);
    await page.locator('input[name="phone"]').fill(testPatient.phone);
    await page.locator('input[name="dateOfBirth"]').fill(testPatient.dateOfBirth);
    
    // 性別選択
    const genderField = page.locator('div[role="button"]:has-text("性別"), [data-testid="gender-select"]').first();
    if (await genderField.isVisible()) {
      await genderField.click();
      await page.getByRole('option', { name: '男性' }).click();
    }
    
    // 保存ボタンをクリック
    const saveButton = page.getByRole('button', { name: /保存|登録/ });
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    
    // レスポンスを待機
    await page.waitForTimeout(3000);
    
    // ネットワークリクエストとレスポンスをログ出力
    console.log('--- 患者登録のリクエスト ---');
    requests.forEach(req => {
      if (req.url.includes('patient') || req.method === 'POST') {
        console.log(`${req.method} ${req.url}`);
        if (req.postData) {
          console.log('POST Data:', req.postData);
        }
      }
    });
    
    console.log('--- 患者登録のレスポンス ---');
    responses.forEach(res => {
      if (res.url.includes('patient') || res.status >= 400) {
        console.log(`${res.status} ${res.statusText} - ${res.url}`);
      }
    });
    
    // 成功メッセージまたはエラーメッセージの確認
    const successMessage = page.locator(':has-text("患者が正常に登録されました"), :has-text("成功"), [role="alert"]');
    const errorMessage = page.locator(':has-text("エラー"), :has-text("失敗"), [role="alert"]');
    
    if (await successMessage.isVisible()) {
      const successText = await successMessage.textContent();
      console.log('成功メッセージ:', successText);
    }
    
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.log('エラーメッセージ:', errorText);
    }
    
    // 現在のURLを確認
    const currentUrl = page.url();
    console.log('保存後のURL:', currentUrl);
    
    // 患者一覧ページに戻って確認
    if (!currentUrl.includes('/patients') || currentUrl.includes('/create')) {
      await page.goto('http://localhost:3000/patients');
    }
    
    await page.waitForTimeout(2000);
    const patientListAfter = await page.locator('[data-testid="patient-row"], .patient-item, tr').count();
    console.log('登録後の患者数:', patientListAfter);
    
    // 新しく登録した患者が一覧に表示されているかチェック
    const newPatientVisible = await page.locator(`text="${testPatient.lastName} ${testPatient.firstName}"`).isVisible();
    console.log('新規患者が一覧に表示されている:', newPatientVisible);
    
    // スクリーンショットを保存
    await page.screenshot({ path: '/Users/naoto/EHR_MVP/e2e-tests/patient-registration-debug.png', fullPage: true });
    console.log('デバッグ用スクリーンショットを保存しました');
    
    console.log('患者登録機能のデバッグ完了');
  });
});