const { test, expect } = require('@playwright/test');

test.describe('患者登録機能テスト', () => {
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

  test('新規患者登録フォームの表示と動作', async ({ page }) => {
    console.log('=== 新規患者登録機能のテスト開始 ===');

    // 新規患者登録ボタンをクリック
    const newPatientButton = page.locator('button:has-text("新規患者登録")');
    await expect(newPatientButton).toBeVisible();
    await newPatientButton.click();
    console.log('✓ 新規患者登録ボタンをクリックしました');

    // モーダルまたは新しいページが開くかを確認
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`現在のURL: ${currentUrl}`);

    // 登録フォームの要素を確認
    const formFields = [
      { name: 'lastName', label: '姓' },
      { name: 'firstName', label: '名' },
      { name: 'lastNameKana', label: '姓（カナ）' },
      { name: 'firstNameKana', label: '名（カナ）' },
      { name: 'email', label: 'メールアドレス' },
      { name: 'phone', label: '電話番号' },
      { name: 'dateOfBirth', label: '生年月日' },
      { name: 'gender', label: '性別' },
      { name: 'address', label: '住所' }
    ];

    const foundFields = [];
    const missingFields = [];

    for (const field of formFields) {
      // 様々なセレクターでフィールドを探す
      const selectors = [
        `input[name="${field.name}"]`,
        `input[id="${field.name}"]`,
        `select[name="${field.name}"]`,
        `textarea[name="${field.name}"]`,
        `input[placeholder*="${field.label}"]`,
        `label:has-text("${field.label}") + input`,
        `label:has-text("${field.label}") ~ input`
      ];

      let fieldFound = false;
      for (const selector of selectors) {
        const element = page.locator(selector);
        const exists = await element.isVisible().catch(() => false);
        if (exists) {
          foundFields.push(field.label);
          fieldFound = true;
          console.log(`✓ ${field.label}フィールドが見つかりました (${selector})`);
          break;
        }
      }

      if (!fieldFound) {
        missingFields.push(field.label);
      }
    }

    console.log(`見つかったフィールド: ${foundFields.join(', ')}`);
    if (missingFields.length > 0) {
      console.log(`見つからないフィールド: ${missingFields.join(', ')}`);
    }

    // 保存ボタンの確認
    const saveButtons = [
      'button:has-text("保存")',
      'button:has-text("登録")',
      'button:has-text("作成")',
      'button[type="submit"]'
    ];

    let saveButtonFound = false;
    for (const selector of saveButtons) {
      const button = page.locator(selector);
      const exists = await button.isVisible().catch(() => false);
      if (exists) {
        const text = await button.textContent();
        console.log(`✓ 保存ボタンが見つかりました: "${text}"`);
        saveButtonFound = true;
        break;
      }
    }

    if (!saveButtonFound) {
      console.log('⚠ 保存ボタンが見つかりません');
    }

    // キャンセルボタンの確認
    const cancelButtons = [
      'button:has-text("キャンセル")',
      'button:has-text("戻る")',
      'button:has-text("閉じる")'
    ];

    for (const selector of cancelButtons) {
      const button = page.locator(selector);
      const exists = await button.isVisible().catch(() => false);
      if (exists) {
        const text = await button.textContent();
        console.log(`✓ キャンセルボタンが見つかりました: "${text}"`);
        break;
      }
    }

    // フォームの全体内容を確認
    const formContent = await page.textContent('body');
    console.log(`フォーム内容: ${formContent.substring(0, 300)}...`);

    // スクリーンショットを保存
    await page.screenshot({ path: 'patient-registration-form.png', fullPage: true });
    console.log('✓ 患者登録フォームのスクリーンショットを保存しました');

    console.log('=== 新規患者登録機能のテスト完了 ===');
  });

  test('患者登録フォームでのデータ入力テスト', async ({ page }) => {
    console.log('=== 患者登録データ入力テスト開始 ===');

    // 新規患者登録ボタンをクリック
    await page.locator('button:has-text("新規患者登録")').click();
    await page.waitForTimeout(2000);

    // テストデータ
    const testPatient = {
      lastName: 'テスト',
      firstName: '太郎',
      lastNameKana: 'テスト',
      firstNameKana: 'タロウ',
      email: 'test.taro@example.com',
      phone: '090-1234-5678',
      dateOfBirth: '1990-01-01',
      gender: '男性',
      address: '東京都渋谷区1-1-1'
    };

    // フィールドに入力を試行
    for (const [fieldName, value] of Object.entries(testPatient)) {
      const selectors = [
        `input[name="${fieldName}"]`,
        `input[id="${fieldName}"]`,
        `select[name="${fieldName}"]`,
        `textarea[name="${fieldName}"]`
      ];

      let inputSuccess = false;
      for (const selector of selectors) {
        const element = page.locator(selector);
        const exists = await element.isVisible().catch(() => false);
        if (exists) {
          try {
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            if (tagName === 'select') {
              // セレクトボックスの場合
              await element.selectOption({ label: value });
            } else {
              // 入力フィールドの場合
              await element.fill(value);
            }
            console.log(`✓ ${fieldName}: "${value}" を入力しました`);
            inputSuccess = true;
            break;
          } catch (error) {
            console.log(`  ${selector} への入力に失敗: ${error.message}`);
          }
        }
      }

      if (!inputSuccess) {
        console.log(`⚠ ${fieldName} フィールドへの入力ができませんでした`);
      }
    }

    // 入力後のスクリーンショット
    await page.screenshot({ path: 'patient-registration-filled.png', fullPage: true });
    console.log('✓ 入力後のスクリーンショットを保存しました');

    // 保存ボタンをクリック
    const saveButton = page.locator('button:has-text("保存"), button:has-text("登録"), button[type="submit"]');
    const saveButtonExists = await saveButton.isVisible().catch(() => false);
    
    if (saveButtonExists) {
      console.log('保存ボタンをクリックします...');
      await saveButton.click();
      await page.waitForTimeout(3000);

      // 保存後の状態を確認
      const currentUrl = page.url();
      const pageContent = await page.textContent('body');
      
      console.log(`保存後URL: ${currentUrl}`);
      
      // 成功メッセージの確認
      const successMessages = [
        'text=登録が完了しました',
        'text=保存しました',
        'text=成功',
        'text=患者が追加されました'
      ];

      let successFound = false;
      for (const selector of successMessages) {
        const message = page.locator(selector);
        const exists = await message.isVisible().catch(() => false);
        if (exists) {
          const text = await message.textContent();
          console.log(`✓ 成功メッセージ: "${text}"`);
          successFound = true;
          break;
        }
      }

      if (!successFound) {
        console.log('⚠ 成功メッセージが確認できませんでした');
      }

      // エラーメッセージの確認
      const errorMessages = [
        'text=エラー',
        'text=失敗',
        'text=入力してください',
        'text=必須',
        '.error',
        '.alert-error'
      ];

      for (const selector of errorMessages) {
        const message = page.locator(selector);
        const exists = await message.isVisible().catch(() => false);
        if (exists) {
          const text = await message.textContent();
          console.log(`⚠ エラーメッセージ: "${text}"`);
        }
      }

      await page.screenshot({ path: 'patient-registration-result.png', fullPage: true });
      console.log('✓ 保存結果のスクリーンショットを保存しました');
    } else {
      console.log('⚠ 保存ボタンが見つかりません');
    }

    console.log('=== 患者登録データ入力テスト完了 ===');
  });
});