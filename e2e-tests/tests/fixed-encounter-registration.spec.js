const { test, expect } = require('@playwright/test');

test.describe('修正版診療録登録と永続化テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('http://localhost:3000');
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
  });

  test('患者作成と診療録登録の完全フロー', async ({ page }) => {
    console.log('=== 患者作成と診療録登録完全フローテスト開始 ===');

    // まず患者を作成
    console.log('--- 患者作成 ---');
    await page.getByRole('button', { name: '患者管理' }).click();
    await page.waitForURL('**/patients');
    
    await page.locator('button:has-text("新規患者登録")').click();
    await page.waitForURL('**/patients/create');
    
    // 患者情報入力
    const patientData = {
      lastName: 'テスト',
      firstName: '診療録',
      lastNameKana: 'テスト',
      firstNameKana: 'シンリョウロク',
      phone: '090-1111-2222',
      dateOfBirth: '1990-01-01'
    };
    
    await page.locator('input[name="lastName"]').fill(patientData.lastName);
    await page.locator('input[name="firstName"]').fill(patientData.firstName);
    await page.locator('input[name="lastNameKana"]').fill(patientData.lastNameKana);
    await page.locator('input[name="firstNameKana"]').fill(patientData.firstNameKana);
    await page.locator('input[name="phone"]').fill(patientData.phone);
    await page.locator('input[name="dateOfBirth"]').fill(patientData.dateOfBirth);
    
    // 性別選択
    await page.locator('div[data-testid="gender-select"]').click();
    await page.locator('[data-value="male"]').click();
    
    // 患者保存
    await page.locator('button[type="submit"]:has-text("保存")').click();
    await page.waitForTimeout(3000);
    console.log('✓ 患者を作成しました');

    // 診療記録作成に移動
    console.log('--- 診療記録作成 ---');
    await page.getByRole('button', { name: '診療記録' }).click();
    await page.waitForURL('**/encounters');
    
    await page.locator('button:has-text("新規診療記録")').click();
    await page.waitForURL('**/encounters/create');

    // APIレスポンス監視
    const apiResponses = [];
    page.on('response', response => {
      if (response.url().includes('/api/v1/encounters') && response.request().method() === 'POST') {
        apiResponses.push({
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // 基本情報入力
    console.log('--- 基本情報入力 ---');
    
    // 患者選択
    const patientSelect = page.locator('div[role="combobox"]').first();
    await patientSelect.click();
    await page.waitForTimeout(1000);
    
    const firstPatient = page.locator('li[role="option"]:not([aria-disabled="true"])').first();
    await firstPatient.click();
    
    // 開始日時
    const startTimeInput = page.locator('input[type="datetime-local"]').first();
    const currentDateTime = new Date();
    const formattedDateTime = currentDateTime.toISOString().slice(0, 16);
    await startTimeInput.fill(formattedDateTime);
    
    // 主訴
    const uniqueComplaint = `修正テスト主訴 ${Date.now()}`;
    await page.locator('input[placeholder*="主訴"]').first().fill(uniqueComplaint);
    console.log(`入力した主訴: ${uniqueComplaint}`);
    
    // 現病歴
    await page.locator('textarea[placeholder*="現在の症状"]').first().fill('修正テスト用の現病歴');
    
    // 次へ
    await page.locator('button:has-text("次へ")').first().click();
    await page.waitForTimeout(1000);

    // ステップ2: バイタルサイン入力
    console.log('--- バイタルサイン入力 ---');
    const vitalInputs = page.locator('input[type="number"]');
    const vitalCount = await vitalInputs.count();
    
    if (vitalCount >= 3) {
      await vitalInputs.nth(0).fill('36.5'); // 体温
      await vitalInputs.nth(1).fill('120');  // 収縮期血圧
      await vitalInputs.nth(2).fill('80');   // 拡張期血圧
      console.log('✓ バイタルサインを入力しました');
    }

    // 次へ
    const nextButton2 = page.locator('button:has-text("次へ")').first();
    if (await nextButton2.isVisible()) {
      await nextButton2.click();
      await page.waitForTimeout(1000);
    }

    // ステップ3: SOAP記録入力
    console.log('--- SOAP記録入力 ---');
    const soapInputs = page.locator('textarea:not([readonly]):not([aria-hidden="true"])');
    const editableCount = await soapInputs.count();
    
    if (editableCount >= 4) {
      await soapInputs.nth(0).fill('患者は修正テストのため来院。症状なし。');
      await soapInputs.nth(1).fill('バイタルサイン安定。身体所見異常なし。');
      await soapInputs.nth(2).fill('健康状態良好。修正テスト完了。');
      await soapInputs.nth(3).fill('次回定期検診を推奨。');
      console.log('✓ SOAP記録を入力しました');
    }

    // 診療記録作成
    console.log('--- 診療記録作成実行 ---');
    const createButton = page.locator('button:has-text("診療記録を作成")');
    
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();
    
    await createButton.click();
    console.log('✓ 診療記録作成ボタンをクリックしました');
    
    // 作成処理完了を待機
    await page.waitForTimeout(5000);

    // APIレスポンスの確認
    console.log('--- API作成結果確認 ---');
    for (const response of apiResponses) {
      console.log(`API Response: ${response.status} ${response.statusText}`);
    }

    // 結果確認
    const currentUrl = page.url();
    console.log(`作成後URL: ${currentUrl}`);

    // エラーメッセージの確認
    const errorMessage = page.locator('[class*="MuiAlert"][severity="error"], [class*="alert"][class*="error"]');
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    if (hasError) {
      const errorText = await errorMessage.textContent();
      console.log(`❌ エラーメッセージ: ${errorText}`);
    } else {
      console.log('✅ エラーメッセージは表示されていません');
    }

    // 成功確認
    const successMessage = page.locator('text=診療記録が正常に作成されました');
    const successVisible = await successMessage.isVisible().catch(() => false);
    
    if (successVisible) {
      console.log('✅ 成功メッセージが表示されました');
    } else if (currentUrl.includes('/encounters') && !currentUrl.includes('/create')) {
      console.log('✅ 診療記録一覧ページにリダイレクトされました');
    }

    // 最終スクリーンショット
    await page.screenshot({ path: 'fixed-encounter-result.png', fullPage: true });
    
    // 診療記録一覧での確認
    if (!currentUrl.includes('/encounters') || currentUrl.includes('/create')) {
      await page.goto('http://localhost:3000/encounters');
      await page.waitForURL('**/encounters');
      await page.waitForTimeout(2000);
    }

    // 作成した記録が表示されているか確認
    const createdRecord = page.locator(`text="${uniqueComplaint}"`);
    const isRecordVisible = await createdRecord.isVisible().catch(() => false);
    
    if (isRecordVisible) {
      console.log('🎉 作成した診療記録が一覧に表示されています！');
    } else {
      console.log('⚠ 作成した診療記録が一覧に表示されていません');
      
      // テーブル内容を確認
      const tableRows = await page.locator('table tbody tr').count();
      console.log(`テーブル行数: ${tableRows}`);
    }

    console.log('=== 患者作成と診療録登録完全フローテスト完了 ===');
  });

  test('診療記録API直接テスト', async ({ page }) => {
    console.log('=== 診療記録API直接テスト開始 ===');

    // 簡単なAPI呼び出しテスト
    const apiResult = await page.evaluate(async () => {
      const token = localStorage.getItem('access_token');
      
      // 最小限のテストデータ
      const testData = {
        patient_id: 1,
        practitioner_id: 1,
        status: "planned",
        encounter_class: "ambulatory",
        start_time: new Date().toISOString(),
        chief_complaint: "API直接テスト"
      };
      
      try {
        const response = await fetch('/api/v1/encounters/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testData)
        });
        
        const responseText = await response.text();
        
        return {
          status: response.status,
          statusText: response.statusText,
          data: responseText,
          success: response.ok
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });

    console.log('API直接テスト結果:');
    console.log(JSON.stringify(apiResult, null, 2));
    
    if (apiResult.success) {
      console.log('✅ API直接呼び出しが成功しました');
    } else {
      console.log('❌ API直接呼び出しが失敗しました');
      if (apiResult.status === 422) {
        console.log('バリデーションエラーの詳細:', apiResult.data);
      }
    }

    console.log('=== 診療記録API直接テスト完了 ===');
  });
});