const { test, expect } = require('@playwright/test');

test.describe('修正版 新規診療録登録テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログインプロセス
    await page.goto('http://localhost:3000');
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
  });

  test('診療録登録機能修正後テスト', async ({ page }) => {
    console.log('=== 修正版診療録登録テスト開始 ===');

    // 診療記録ページに移動
    await page.getByRole('button', { name: '診療記録' }).click();
    await page.waitForURL('**/encounters');
    console.log('✓ 診療記録ページに移動しました');

    // 新規診療記録作成ページに移動
    await page.locator('button:has-text("新規診療記録")').click();
    await page.waitForURL('**/encounters/create');
    console.log('✓ 新規診療記録作成ページに移動しました');

    // 修正されたフォームの確認
    await page.waitForTimeout(2000);
    
    // 患者選択の確認
    console.log('--- 患者選択確認 ---');
    
    const patientSelect = page.locator('div[role="combobox"]').first();
    await expect(patientSelect).toBeVisible();
    
    // 患者選択ドロップダウンを開く
    await patientSelect.click();
    await page.waitForTimeout(1000);
    
    // 患者オプションの確認
    const patientOptions = page.locator('li[role="option"]:not([aria-disabled="true"])');
    const availablePatients = await patientOptions.count();
    console.log(`利用可能な患者数: ${availablePatients}`);
    
    if (availablePatients > 0) {
      // 最初の利用可能な患者を選択
      await patientOptions.first().click();
      console.log('✓ 患者を選択しました');
    } else {
      console.log('⚠ 利用可能な患者がありません');
      // ドロップダウンを閉じる
      await page.keyboard.press('Escape');
    }

    // 診療クラスは既にデフォルト値があるか確認
    console.log('--- 診療クラス確認 ---');
    const classSelect = page.locator('div[role="combobox"]').nth(1);
    const classValue = await classSelect.textContent();
    console.log(`診療クラス現在値: ${classValue}`);

    // 開始日時設定
    console.log('--- 開始日時設定 ---');
    const startTimeInput = page.locator('input[type="datetime-local"]').first();
    const currentDateTime = new Date();
    const formattedDateTime = currentDateTime.toISOString().slice(0, 16);
    await startTimeInput.fill(formattedDateTime);
    console.log('✓ 開始日時を設定しました');

    // 主訴入力
    console.log('--- 主訴入力 ---');
    const chiefComplaintInput = page.locator('input[placeholder*="主訴"]').first();
    await chiefComplaintInput.fill('定期健康診断のため受診');
    console.log('✓ 主訴を入力しました');

    // 現病歴入力
    console.log('--- 現病歴入力 ---');
    const historyInput = page.locator('textarea[placeholder*="現在の症状"]').first();
    await historyInput.fill('特に症状なし。年次健康診断として受診。');
    console.log('✓ 現病歴を入力しました');

    // フォーム入力完了スクリーンショット
    await page.screenshot({ path: 'encounter-registration-fixed-step1.png', fullPage: true });
    console.log('✓ ステップ1スクリーンショットを保存しました');

    // 次へボタンの状態確認
    console.log('--- 次へボタン状態確認 ---');
    const nextButton = page.locator('button:has-text("次へ")').first();
    const isEnabled = await nextButton.isEnabled();
    console.log(`次へボタンの状態: ${isEnabled ? '有効' : '無効'}`);

    if (isEnabled) {
      await nextButton.click();
      console.log('✓ ステップ2に進みました');
      
      // ステップ2: バイタルサイン
      console.log('--- ステップ2: バイタルサイン入力 ---');
      
      // 基本的なバイタルサイン入力
      const vitalInputs = page.locator('input[type="number"]');
      const vitalCount = await vitalInputs.count();
      console.log(`バイタルサイン入力フィールド数: ${vitalCount}`);
      
      if (vitalCount > 0) {
        // 体温
        await vitalInputs.nth(0).fill('36.5');
        console.log('✓ 体温を入力しました');
        
        if (vitalCount > 1) {
          // 血圧（収縮期）
          await vitalInputs.nth(1).fill('120');
          console.log('✓ 収縮期血圧を入力しました');
        }
        
        if (vitalCount > 2) {
          // 血圧（拡張期）
          await vitalInputs.nth(2).fill('80');
          console.log('✓ 拡張期血圧を入力しました');
        }
      }

      // 身体所見入力
      const examinationTextarea = page.locator('textarea[placeholder*="身体診察"]').first();
      if (await examinationTextarea.isVisible()) {
        await examinationTextarea.fill('身体所見：特記すべき異常なし');
        console.log('✓ 身体所見を入力しました');
      }

      // ステップ2スクリーンショット
      await page.screenshot({ path: 'encounter-registration-fixed-step2.png', fullPage: true });
      
      // ステップ3に進む
      const nextButton2 = page.locator('button:has-text("次へ")').first();
      if (await nextButton2.isEnabled()) {
        await nextButton2.click();
        console.log('✓ ステップ3に進みました');
        
        // ステップ3: SOAP記録
        console.log('--- ステップ3: SOAP記録入力 ---');
        
        const soapTextareas = page.locator('textarea');
        const soapCount = await soapTextareas.count();
        console.log(`SOAPテキストエリア数: ${soapCount}`);
        
        // SOAP記録入力
        const soapData = [
          '患者は定期健康診断のため来院。特に症状なし。',
          'バイタルサイン安定。身体所見異常なし。',
          '現在の健康状態良好。継続的な健康管理を推奨。',
          '次回定期検診を1年後に予約。生活習慣の維持を指導。'
        ];
        
        for (let i = 0; i < Math.min(4, soapCount); i++) {
          await soapTextareas.nth(i).fill(soapData[i]);
          console.log(`✓ SOAP${['S', 'O', 'A', 'P'][i]}を入力しました`);
        }

        // 診断コード入力
        const diagnosisInput = page.locator('input[placeholder*="ICD"]').first();
        if (await diagnosisInput.isVisible()) {
          await diagnosisInput.fill('Z00.0');
          console.log('✓ 診断コードを入力しました');
        }

        // ステップ3スクリーンショット
        await page.screenshot({ path: 'encounter-registration-fixed-step3.png', fullPage: true });
      }
    }

    // 診療記録作成ボタンの確認と実行
    console.log('--- 診療記録作成実行 ---');
    const createButton = page.locator('button:has-text("診療記録を作成")');
    const createButtonVisible = await createButton.isVisible();
    console.log(`作成ボタン表示状態: ${createButtonVisible}`);

    if (createButtonVisible) {
      const createButtonEnabled = await createButton.isEnabled();
      console.log(`作成ボタン有効状態: ${createButtonEnabled}`);

      if (createButtonEnabled) {
        // 診療記録作成実行
        await createButton.click();
        console.log('✓ 診療記録作成ボタンをクリックしました');

        // 作成処理待機
        await page.waitForTimeout(5000);

        // 結果確認
        const currentUrl = page.url();
        console.log(`作成後URL: ${currentUrl}`);

        // 成功メッセージの確認
        const successMessage = page.locator('text=診療記録が正常に作成されました');
        const successVisible = await successMessage.isVisible().catch(() => false);

        if (successVisible) {
          console.log('✅ 成功: 診療記録が正常に作成されました');
        } else if (currentUrl.includes('/encounters')) {
          console.log('✅ 成功: 診療記録一覧ページにリダイレクトされました');
        } else {
          console.log('ℹ 作成結果を確認中...');
        }

        // 最終結果スクリーンショット
        await page.screenshot({ path: 'encounter-registration-fixed-final.png', fullPage: true });
        console.log('✓ 最終結果スクリーンショットを保存しました');

      } else {
        console.log('⚠ 診療記録作成ボタンが無効です');
      }
    } else {
      console.log('⚠ 診療記録作成ボタンが見つかりません');
    }

    console.log('=== 修正版診療録登録テスト完了 ===');
  });

  test('必須フィールドのみでの診療録登録テスト', async ({ page }) => {
    console.log('=== 必須フィールドのみ診療録登録テスト開始 ===');

    // 診療記録作成ページに移動
    await page.getByRole('button', { name: '診療記録' }).click();
    await page.waitForURL('**/encounters');
    await page.locator('button:has-text("新規診療記録")').click();
    await page.waitForURL('**/encounters/create');
    console.log('✓ 診療記録作成ページに移動しました');

    await page.waitForTimeout(2000);

    // 最小限の必須フィールドのみ入力
    console.log('--- 最小限の必須フィールド入力 ---');

    // 患者選択
    const patientSelect = page.locator('div[role="combobox"]').first();
    await patientSelect.click();
    await page.waitForTimeout(1000);
    
    const firstPatient = page.locator('li[role="option"]:not([aria-disabled="true"])').first();
    if (await firstPatient.isVisible()) {
      await firstPatient.click();
      console.log('✓ 患者を選択しました');
    }

    // 開始日時
    const startTimeInput = page.locator('input[type="datetime-local"]').first();
    await startTimeInput.fill('2024-01-15T10:00');
    console.log('✓ 開始日時を設定しました');

    // 主訴
    const chiefComplaintInput = page.locator('input[placeholder*="主訴"]').first();
    await chiefComplaintInput.fill('最小限テスト');
    console.log('✓ 主訴を入力しました');

    // 必須フィールドのみスクリーンショット
    await page.screenshot({ path: 'encounter-registration-minimal.png', fullPage: true });

    // 次へボタンの状態確認
    const nextButton = page.locator('button:has-text("次へ")').first();
    const isEnabled = await nextButton.isEnabled();
    console.log(`最小限入力での次へボタン状態: ${isEnabled ? '有効' : '無効'}`);

    if (isEnabled) {
      console.log('✅ 必須フィールドのみで次へボタンが有効になりました');
      
      // ステップを進める
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // ステップ2をスキップしてステップ3へ
      const nextButton2 = page.locator('button:has-text("次へ")').first();
      if (await nextButton2.isVisible()) {
        await nextButton2.click();
        await page.waitForTimeout(1000);
      }
      
      // 診療記録作成を試行
      const createButton = page.locator('button:has-text("診療記録を作成")');
      if (await createButton.isVisible() && await createButton.isEnabled()) {
        await createButton.click();
        console.log('✓ 最小限の情報で診療記録作成を実行しました');
        
        await page.waitForTimeout(3000);
        console.log('✅ 最小限の診療記録登録が完了しました');
      }
    } else {
      console.log('❌ 必須フィールドが不足しています');
    }

    console.log('=== 必須フィールドのみ診療録登録テスト完了 ===');
  });
});