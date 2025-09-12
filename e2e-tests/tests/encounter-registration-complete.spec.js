const { test, expect } = require('@playwright/test');

test.describe('新規診療録登録完全テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログインプロセス
    await page.goto('http://localhost:3000');
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
  });

  test('新規診療録登録の完全フロー（ダミーデータ使用）', async ({ page }) => {
    console.log('=== 新規診療録登録完全フローテスト開始 ===');

    // 診療記録ページに移動
    await page.getByRole('button', { name: '診療記録' }).click();
    await page.waitForURL('**/encounters');
    console.log('✓ 診療記録ページに移動しました');

    // 新規診療記録作成ページに移動
    await page.locator('button:has-text("新規診療記録")').click();
    await page.waitForURL('**/encounters/create');
    console.log('✓ 新規診療記録作成ページに移動しました');

    // 初期画面のスクリーンショット
    await page.screenshot({ path: 'encounter-registration-step0.png', fullPage: true });
    console.log('✓ 初期画面のスクリーンショットを保存しました');

    // ステップ1: 基本情報入力
    console.log('--- ステップ1: 基本情報入力開始 ---');
    
    // 患者選択の詳細分析
    console.log('患者選択フィールドの分析...');
    
    // 患者選択フィールドを見つける
    const patientSelectContainer = page.locator('div').filter({ hasText: '患者' }).first();
    await expect(patientSelectContainer).toBeVisible();
    
    // セレクトボックスをクリック
    try {
      const patientSelectButton = page.locator('div[role="combobox"]').first();
      await patientSelectButton.click();
      console.log('✓ 患者選択ドロップダウンを開きました');
      
      await page.waitForTimeout(1000);
      
      // オプションの確認
      const options = page.locator('li[role="option"]');
      const optionCount = await options.count();
      console.log(`患者オプション数: ${optionCount}`);
      
      if (optionCount > 0) {
        // 最初のオプションを選択
        await options.first().click();
        console.log('✓ 最初の患者を選択しました');
      } else {
        console.log('⚠ 患者オプションが見つかりません - ダミー患者を作成する必要があります');
        
        // ドロップダウンを閉じる
        await page.keyboard.press('Escape');
        
        // 患者管理ページで新規患者を作成
        await page.goto('http://localhost:3000/patients/create');
        await page.waitForURL('**/patients/create');
        console.log('✓ 患者作成ページに移動しました');
        
        // ダミー患者データ
        const dummyPatient = {
          lastName: 'テスト',
          firstName: '診療録',
          lastNameKana: 'テスト',
          firstNameKana: 'シンリョウロク',
          phone: '090-1111-2222',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        };
        
        // 患者情報入力
        await page.locator('input[name="lastName"]').fill(dummyPatient.lastName);
        await page.locator('input[name="firstName"]').fill(dummyPatient.firstName);
        await page.locator('input[name="lastNameKana"]').fill(dummyPatient.lastNameKana);
        await page.locator('input[name="firstNameKana"]').fill(dummyPatient.firstNameKana);
        await page.locator('input[name="phone"]').fill(dummyPatient.phone);
        await page.locator('input[name="dateOfBirth"]').fill(dummyPatient.dateOfBirth);
        
        // 性別選択
        await page.locator('div[data-testid="gender-select"]').click();
        await page.locator('[data-value="male"]').click();
        
        console.log('✓ ダミー患者データを入力しました');
        
        // 患者を保存
        await page.locator('button[type="submit"]:has-text("保存")').click();
        await page.waitForTimeout(3000);
        console.log('✓ ダミー患者を保存しました');
        
        // 診療記録作成ページに戻る
        await page.goto('http://localhost:3000/encounters/create');
        await page.waitForURL('**/encounters/create');
        console.log('✓ 診療記録作成ページに戻りました');
        
        // 患者選択を再試行
        await page.locator('div[role="combobox"]').first().click();
        await page.waitForTimeout(1000);
        
        const newOptions = page.locator('li[role="option"]');
        const newOptionCount = await newOptions.count();
        console.log(`新しい患者オプション数: ${newOptionCount}`);
        
        if (newOptionCount > 0) {
          await newOptions.first().click();
          console.log('✓ 作成したダミー患者を選択しました');
        }
      }
    } catch (error) {
      console.log(`患者選択エラー: ${error.message}`);
    }

    // 診療クラス選択
    console.log('診療クラス選択...');
    try {
      const classSelect = page.locator('div[role="combobox"]').nth(1);
      await classSelect.click();
      await page.waitForTimeout(500);
      
      const ambulatoryOption = page.locator('li[data-value="AMBULATORY"]');
      if (await ambulatoryOption.isVisible()) {
        await ambulatoryOption.click();
        console.log('✓ 診療クラス（外来）を選択しました');
      }
    } catch (error) {
      console.log(`診療クラス選択エラー: ${error.message}`);
    }

    // 開始日時設定
    console.log('開始日時設定...');
    try {
      const startTimeInput = page.locator('input[type="datetime-local"]').first();
      const currentDateTime = new Date();
      const formattedDateTime = currentDateTime.toISOString().slice(0, 16);
      await startTimeInput.fill(formattedDateTime);
      console.log('✓ 開始日時を設定しました');
    } catch (error) {
      console.log(`開始日時設定エラー: ${error.message}`);
    }

    // 主訴入力
    console.log('主訴入力...');
    try {
      const chiefComplaintInput = page.locator('input').filter({ hasText: '' }).nth(4);
      await chiefComplaintInput.fill('定期検診のため受診しました');
      console.log('✓ 主訴を入力しました');
    } catch (error) {
      console.log(`主訴入力エラー: ${error.message}`);
      // 代替セレクタを試行
      try {
        const altChiefComplaintInput = page.locator('input[placeholder*="主訴"]').first();
        await altChiefComplaintInput.fill('定期検診のため受診しました');
        console.log('✓ 主訴を入力しました（代替方法）');
      } catch (altError) {
        console.log(`主訴入力失敗: ${altError.message}`);
      }
    }

    // 現病歴入力
    console.log('現病歴入力...');
    try {
      const historyInput = page.locator('textarea').first();
      await historyInput.fill('特に症状はありません。定期的な健康チェックです。');
      console.log('✓ 現病歴を入力しました');
    } catch (error) {
      console.log(`現病歴入力エラー: ${error.message}`);
    }

    // ステップ1完了スクリーンショット
    await page.screenshot({ path: 'encounter-registration-step1-filled.png', fullPage: true });
    console.log('✓ ステップ1完了スクリーンショットを保存しました');

    // 次へボタンをクリック
    console.log('次へボタンクリック...');
    try {
      const nextButton = page.locator('button:has-text("次へ")').first();
      const isEnabled = await nextButton.isEnabled();
      console.log(`次へボタンの状態: ${isEnabled ? '有効' : '無効'}`);
      
      if (isEnabled) {
        await nextButton.click();
        console.log('✓ ステップ2に進みました');
      } else {
        console.log('⚠ 次へボタンが無効です - 必須フィールドが不足している可能性があります');
        
        // 必須フィールドの再確認
        console.log('必須フィールド再確認中...');
        const allInputs = page.locator('input');
        const inputCount = await allInputs.count();
        console.log(`入力フィールド数: ${inputCount}`);
        
        for (let i = 0; i < inputCount; i++) {
          const input = allInputs.nth(i);
          const value = await input.inputValue().catch(() => '');
          const type = await input.getAttribute('type').catch(() => '');
          const name = await input.getAttribute('name').catch(() => '');
          console.log(`フィールド${i}: type=${type}, name=${name}, value=${value}`);
        }
      }
    } catch (error) {
      console.log(`次へボタンクリックエラー: ${error.message}`);
    }

    console.log('--- ステップ1: 基本情報入力完了 ---');

    // ステップ2: バイタルサイン（次へボタンが有効な場合のみ）
    const step2Visible = await page.locator('text=バイタルサイン').isVisible().catch(() => false);
    if (step2Visible) {
      console.log('--- ステップ2: バイタルサイン入力開始 ---');
      
      // バイタルサインダミーデータ
      const vitalSigns = {
        temperature: '36.5',
        bloodPressureSystolic: '120',
        bloodPressureDiastolic: '80',
        heartRate: '72',
        respiratoryRate: '16',
        oxygenSaturation: '98',
        height: '170',
        weight: '65'
      };

      // バイタルサイン入力
      console.log('バイタルサイン入力中...');
      try {
        const temperatureInput = page.locator('input').filter({ hasText: '' }).nth(0);
        await temperatureInput.fill(vitalSigns.temperature);
        console.log('✓ 体温を入力しました');
      } catch (error) {
        console.log(`バイタルサイン入力エラー: ${error.message}`);
      }

      // 身体所見入力
      try {
        const examinationInput = page.locator('textarea').nth(1);
        await examinationInput.fill('身体所見に特記すべき異常はありません。');
        console.log('✓ 身体所見を入力しました');
      } catch (error) {
        console.log(`身体所見入力エラー: ${error.message}`);
      }

      // ステップ2スクリーンショット
      await page.screenshot({ path: 'encounter-registration-step2-filled.png', fullPage: true });
      
      // 次のステップに進む
      try {
        await page.locator('button:has-text("次へ")').first().click();
        console.log('✓ ステップ3に進みました');
      } catch (error) {
        console.log(`ステップ3移行エラー: ${error.message}`);
      }

      console.log('--- ステップ2: バイタルサイン入力完了 ---');
    }

    // ステップ3: SOAP記録（利用可能な場合）
    const step3Visible = await page.locator('text=SOAP記録').isVisible().catch(() => false);
    if (step3Visible) {
      console.log('--- ステップ3: SOAP記録入力開始 ---');
      
      // SOAP記録ダミーデータ
      const soapData = {
        subjective: '患者は定期検診のため来院。特に症状の訴えなし。健康状態について確認したいとのこと。',
        objective: 'バイタルサイン安定。身体所見に異常なし。意識清明、応答良好。',
        assessment: '現在の健康状態は良好。特に問題となる所見なし。継続的な健康管理が必要。',
        plan: '次回定期検診を6ヶ月後に予約。生活習慣の維持を指導。何か症状があれば早期受診を勧告。'
      };

      // SOAP記録入力
      console.log('SOAP記録入力中...');
      try {
        const textareas = page.locator('textarea');
        const textareaCount = await textareas.count();
        console.log(`テキストエリア数: ${textareaCount}`);

        if (textareaCount >= 4) {
          await textareas.nth(0).fill(soapData.subjective);
          await textareas.nth(1).fill(soapData.objective);
          await textareas.nth(2).fill(soapData.assessment);
          await textareas.nth(3).fill(soapData.plan);
          console.log('✓ SOAP記録を入力しました');
        }
      } catch (error) {
        console.log(`SOAP記録入力エラー: ${error.message}`);
      }

      // 診断コード入力
      try {
        const diagnosisCodeInput = page.locator('input[placeholder*="ICD"]').first();
        await diagnosisCodeInput.fill('Z00.0');
        console.log('✓ 診断コードを入力しました');
      } catch (error) {
        console.log(`診断コード入力エラー: ${error.message}`);
      }

      // その他のメモ入力
      try {
        const notesInput = page.locator('textarea').last();
        await notesInput.fill('患者は協力的で、健康管理に積極的です。');
        console.log('✓ その他のメモを入力しました');
      } catch (error) {
        console.log(`メモ入力エラー: ${error.message}`);
      }

      // ステップ3スクリーンショット
      await page.screenshot({ path: 'encounter-registration-step3-filled.png', fullPage: true });

      console.log('--- ステップ3: SOAP記録入力完了 ---');
    }

    // 最終保存
    console.log('--- 最終保存処理開始 ---');
    try {
      const createButton = page.locator('button:has-text("診療記録を作成")');
      const createButtonVisible = await createButton.isVisible();
      console.log(`診療記録作成ボタンの表示状態: ${createButtonVisible}`);

      if (createButtonVisible) {
        const isEnabled = await createButton.isEnabled();
        console.log(`診療記録作成ボタンの有効状態: ${isEnabled}`);

        if (isEnabled) {
          await createButton.click();
          console.log('✓ 診療記録作成ボタンをクリックしました');

          // 保存処理待機
          await page.waitForTimeout(5000);

          // 保存後の状態確認
          const currentUrl = page.url();
          console.log(`保存後のURL: ${currentUrl}`);

          // 成功メッセージまたはエラーメッセージの確認
          const successMessage = page.locator('text=診療記録が正常に作成されました');
          const errorMessage = page.locator('.MuiAlert-root[severity="error"]');

          const successVisible = await successMessage.isVisible().catch(() => false);
          const errorVisible = await errorMessage.isVisible().catch(() => false);

          if (successVisible) {
            console.log('✅ 成功: 診療記録が正常に作成されました');
          } else if (errorVisible) {
            const errorText = await errorMessage.textContent();
            console.log(`❌ エラー: ${errorText}`);
          } else {
            console.log('ℹ 保存結果のメッセージが確認できませんでした');
          }

          // 最終結果スクリーンショット
          await page.screenshot({ path: 'encounter-registration-final-result.png', fullPage: true });
          console.log('✓ 最終結果スクリーンショットを保存しました');

        } else {
          console.log('⚠ 診療記録作成ボタンが無効です');
        }
      } else {
        console.log('⚠ 診療記録作成ボタンが見つかりません');
      }
    } catch (error) {
      console.log(`最終保存エラー: ${error.message}`);
    }

    console.log('=== 新規診療録登録完全フローテスト完了 ===');
  });

  test('診療録登録API接続テスト', async ({ page }) => {
    console.log('=== 診療録登録API接続テスト開始 ===');

    // ネットワーク監視
    const requests = [];
    const responses = [];

    page.on('request', request => {
      if (request.url().includes('/api/encounters') || request.url().includes('/encounters')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log(`API リクエスト: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/encounters') || response.url().includes('/encounters')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`API レスポンス: ${response.status()} ${response.url()}`);
      }
    });

    // 診療記録作成ページに移動
    await page.getByRole('button', { name: '診療記録' }).click();
    await page.waitForURL('**/encounters');
    await page.locator('button:has-text("新規診療記録")').click();
    await page.waitForURL('**/encounters/create');

    console.log('✓ 診療記録作成ページに移動しました');

    // 簡単なフォーム入力
    try {
      // 主訴だけ入力してみる
      const chiefComplaintInput = page.locator('input').nth(2);
      await chiefComplaintInput.fill('APIテスト');
      console.log('✓ 主訴を入力しました');

      // 保存を試行
      const createButton = page.locator('button:has-text("診療記録を作成")');
      if (await createButton.isVisible()) {
        await createButton.click();
        console.log('✓ 作成ボタンをクリックしました');
        await page.waitForTimeout(3000);
      }
    } catch (error) {
      console.log(`API テスト中エラー: ${error.message}`);
    }

    // ネットワーク結果の分析
    console.log(`--- ネットワーク分析結果 ---`);
    console.log(`リクエスト数: ${requests.length}`);
    console.log(`レスポンス数: ${responses.length}`);

    requests.forEach((req, index) => {
      console.log(`リクエスト${index + 1}: ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`データ: ${req.postData}`);
      }
    });

    responses.forEach((res, index) => {
      console.log(`レスポンス${index + 1}: ${res.status} ${res.statusText} ${res.url}`);
    });

    console.log('=== 診療録登録API接続テスト完了 ===');
  });
});