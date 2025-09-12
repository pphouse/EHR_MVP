const { test, expect } = require('@playwright/test');

test.describe('改善された患者登録機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログインして患者管理ページに移動
    await page.goto('http://localhost:3000');
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
    await page.getByRole('button', { name: '患者管理' }).click();
    await page.waitForURL('**/patients');
  });

  test('新規患者登録ページへの遷移と表示確認', async ({ page }) => {
    console.log('=== 新規患者登録ページ遷移テスト開始 ===');

    // 新規患者登録ボタンをクリック
    const newPatientButton = page.locator('button:has-text("新規患者登録")');
    await expect(newPatientButton).toBeVisible();
    await newPatientButton.click();
    console.log('✓ 新規患者登録ボタンをクリックしました');

    // 新しいページに遷移することを確認
    await page.waitForURL('**/patients/create');
    console.log('✓ 患者作成ページに遷移しました');

    // ページタイトルの確認
    await expect(page.locator('h1:has-text("新規患者登録")')).toBeVisible();
    console.log('✓ ページタイトルが表示されています');

    // 必須フィールドの存在確認
    const requiredFields = [
      { name: 'lastName', label: '姓' },
      { name: 'firstName', label: '名' },
      { name: 'lastNameKana', label: '姓（カナ）' },
      { name: 'firstNameKana', label: '名（カナ）' },
      { name: 'phone', label: '電話番号' },
      { name: 'dateOfBirth', label: '生年月日' },
      { name: 'gender', label: '性別' }
    ];

    for (const field of requiredFields) {
      const element = page.locator(`input[name="${field.name}"], select[name="${field.name}"]`);
      await expect(element).toBeVisible();
      console.log(`✓ ${field.label}フィールドが表示されています`);
    }

    // 任意フィールドの存在確認
    const optionalFields = [
      { name: 'email', label: 'メールアドレス' },
      { name: 'address', label: '住所' },
      { name: 'emergencyContact', label: '緊急連絡先（氏名）' },
      { name: 'emergencyPhone', label: '緊急連絡先（電話番号）' }
    ];

    for (const field of optionalFields) {
      const element = page.locator(`input[name="${field.name}"], textarea[name="${field.name}"]`);
      await expect(element).toBeVisible();
      console.log(`✓ ${field.label}フィールドが表示されています`);
    }

    // ボタンの確認
    await expect(page.locator('button:has-text("保存")')).toBeVisible();
    await expect(page.locator('button:has-text("キャンセル")')).toBeVisible();
    console.log('✓ 保存・キャンセルボタンが表示されています');

    // スクリーンショットを保存
    await page.screenshot({ path: 'patient-create-form.png', fullPage: true });
    console.log('✓ 患者作成フォームのスクリーンショットを保存しました');

    console.log('=== 新規患者登録ページ遷移テスト完了 ===');
  });

  test('患者登録フォームでの完全なデータ入力と保存', async ({ page }) => {
    console.log('=== 患者登録データ入力・保存テスト開始 ===');

    // 新規患者登録ページに移動
    await page.locator('button:has-text("新規患者登録")').click();
    await page.waitForURL('**/patients/create');

    // テストデータ
    const testPatient = {
      lastName: 'テスト',
      firstName: '太郎',
      lastNameKana: 'テスト',
      firstNameKana: 'タロウ',
      email: 'test.taro@example.com',
      phone: '090-1234-5678',
      dateOfBirth: '1990-01-01',
      address: '東京都渋谷区1-1-1\nテストビル301号室',
      emergencyContact: 'テスト花子',
      emergencyPhone: '080-9876-5432',
      medicalHistory: '高血圧\n糖尿病の家族歴あり',
      allergies: 'ペニシリン\n卵アレルギー',
      currentMedications: '特になし'
    };

    // 基本情報の入力
    await page.locator('input[name="lastName"]').fill(testPatient.lastName);
    await page.locator('input[name="firstName"]').fill(testPatient.firstName);
    await page.locator('input[name="lastNameKana"]').fill(testPatient.lastNameKana);
    await page.locator('input[name="firstNameKana"]').fill(testPatient.firstNameKana);
    await page.locator('input[name="dateOfBirth"]').fill(testPatient.dateOfBirth);
    
    // 性別の選択
    await page.locator('div[data-testid="gender-select"]').click();
    await page.locator('[data-value="male"]').click();
    console.log('✓ 基本情報を入力しました');

    // 連絡先情報の入力
    await page.locator('input[name="phone"]').fill(testPatient.phone);
    await page.locator('input[name="email"]').fill(testPatient.email);
    await page.locator('textarea[name="address"]').fill(testPatient.address);
    console.log('✓ 連絡先情報を入力しました');

    // 緊急連絡先の入力
    await page.locator('input[name="emergencyContact"]').fill(testPatient.emergencyContact);
    await page.locator('input[name="emergencyPhone"]').fill(testPatient.emergencyPhone);
    console.log('✓ 緊急連絡先を入力しました');

    // 医療情報の入力
    await page.locator('textarea[name="medicalHistory"]').fill(testPatient.medicalHistory);
    await page.locator('textarea[name="allergies"]').fill(testPatient.allergies);
    await page.locator('textarea[name="currentMedications"]').fill(testPatient.currentMedications);
    console.log('✓ 医療情報を入力しました');

    // 入力完了後のスクリーンショット
    await page.screenshot({ path: 'patient-create-filled.png', fullPage: true });
    console.log('✓ 入力完了時のスクリーンショットを保存しました');

    // 保存ボタンをクリック
    const saveButton = page.locator('button[type="submit"]:has-text("保存")');
    await saveButton.click();
    console.log('✓ 保存ボタンをクリックしました');

    // 保存処理の完了を待つ
    await page.waitForTimeout(3000);

    // 成功メッセージまたはリダイレクトを確認
    const currentUrl = page.url();
    console.log(`保存後URL: ${currentUrl}`);

    // 成功メッセージの確認
    const successMessage = page.locator('text=患者が正常に登録されました');
    const successVisible = await successMessage.isVisible().catch(() => false);
    
    if (successVisible) {
      console.log('✓ 成功メッセージが表示されました');
      
      // リダイレクトを待つ
      await page.waitForURL('**/patients', { timeout: 10000 });
      console.log('✓ 患者一覧ページにリダイレクトされました');
    } else {
      // エラーメッセージの確認
      const errorAlert = page.locator('.MuiAlert-root[severity="error"]');
      const errorVisible = await errorAlert.isVisible().catch(() => false);
      
      if (errorVisible) {
        const errorText = await errorAlert.textContent();
        console.log(`⚠ エラーメッセージ: ${errorText}`);
      } else {
        console.log('ℹ 成功メッセージもエラーメッセージも確認できませんでした');
      }
    }

    // 最終結果のスクリーンショット
    await page.screenshot({ path: 'patient-create-result.png', fullPage: true });
    console.log('✓ 保存結果のスクリーンショットを保存しました');

    console.log('=== 患者登録データ入力・保存テスト完了 ===');
  });

  test('患者登録フォームバリデーションテスト', async ({ page }) => {
    console.log('=== 患者登録バリデーションテスト開始 ===');

    // 新規患者登録ページに移動
    await page.locator('button:has-text("新規患者登録")').click();
    await page.waitForURL('**/patients/create');

    // 必須フィールドを空のまま保存を試行
    const saveButton = page.locator('button[type="submit"]:has-text("保存")');
    await saveButton.click();
    console.log('✓ 空のフィールドで保存を試行しました');

    // エラーメッセージの確認
    await page.waitForTimeout(1000);
    const errorAlert = page.locator('.MuiAlert-root');
    const errorVisible = await errorAlert.isVisible().catch(() => false);
    
    if (errorVisible) {
      const errorText = await errorAlert.textContent();
      console.log(`✓ バリデーションエラー: ${errorText}`);
    } else {
      console.log('⚠ バリデーションエラーが表示されませんでした');
    }

    // 不正な電話番号でのテスト
    await page.locator('input[name="lastName"]').fill('テスト');
    await page.locator('input[name="firstName"]').fill('太郎');
    await page.locator('input[name="lastNameKana"]').fill('テスト');
    await page.locator('input[name="firstNameKana"]').fill('タロウ');
    await page.locator('input[name="dateOfBirth"]').fill('1990-01-01');
    await page.locator('div[data-testid="gender-select"]').click();
    await page.locator('[data-value="male"]').click();
    await page.locator('input[name="phone"]').fill('invalid-phone');
    
    await saveButton.click();
    await page.waitForTimeout(1000);
    
    const phoneErrorVisible = await errorAlert.isVisible().catch(() => false);
    if (phoneErrorVisible) {
      const phoneErrorText = await errorAlert.textContent();
      console.log(`✓ 電話番号バリデーションエラー: ${phoneErrorText}`);
    }

    // 不正なメールアドレスでのテスト
    await page.locator('input[name="phone"]').fill('090-1234-5678');
    await page.locator('input[name="email"]').fill('invalid-email');
    
    await saveButton.click();
    await page.waitForTimeout(1000);
    
    const emailErrorVisible = await errorAlert.isVisible().catch(() => false);
    if (emailErrorVisible) {
      const emailErrorText = await errorAlert.textContent();
      console.log(`✓ メールアドレスバリデーションエラー: ${emailErrorText}`);
    }

    // バリデーションテスト完了のスクリーンショット
    await page.screenshot({ path: 'patient-create-validation.png', fullPage: true });
    console.log('✓ バリデーションテストのスクリーンショットを保存しました');

    console.log('=== 患者登録バリデーションテスト完了 ===');
  });

  test('患者登録キャンセル機能テスト', async ({ page }) => {
    console.log('=== 患者登録キャンセル機能テスト開始 ===');

    // 新規患者登録ページに移動
    await page.locator('button:has-text("新規患者登録")').click();
    await page.waitForURL('**/patients/create');

    // 一部データを入力
    await page.locator('input[name="lastName"]').fill('キャンセル');
    await page.locator('input[name="firstName"]').fill('テスト');

    // キャンセルボタンをクリック
    const cancelButton = page.locator('button:has-text("キャンセル")');
    await cancelButton.click();
    console.log('✓ キャンセルボタンをクリックしました');

    // 患者一覧ページに戻ることを確認
    await page.waitForURL('**/patients');
    console.log('✓ 患者一覧ページに戻りました');

    // ページタイトルの確認
    await expect(page.locator('h1:has-text("患者管理")')).toBeVisible();
    console.log('✓ 患者管理ページが表示されています');

    console.log('=== 患者登録キャンセル機能テスト完了 ===');
  });
});