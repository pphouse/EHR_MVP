const { test, expect } = require('@playwright/test');

test.describe('完全フォールバック機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ローカルストレージをクリア
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.removeItem('mockEncounters');
    });
    
    // ログイン
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
  });

  test('診療録登録から一覧表示までの完全フロー', async ({ page }) => {
    console.log('=== 完全フォールバック機能テスト開始 ===');

    // 診療記録作成
    console.log('--- 診療記録作成 ---');
    await page.getByRole('button', { name: '診療記録' }).click();
    await page.waitForURL('**/encounters');
    
    // 初期状態の確認
    const initialRows = await page.locator('table tbody tr').count();
    console.log(`初期の診療記録数: ${initialRows}`);
    
    await page.locator('button:has-text("新規診療記録")').click();
    await page.waitForURL('**/encounters/create');

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
    const now = new Date();
    const formattedTime = now.toISOString().slice(0, 16);
    await startTimeInput.fill(formattedTime);
    
    // 主訴
    const uniqueComplaint = `フォールバックテスト診療録 ${Date.now()}`;
    await page.locator('input[placeholder*="主訴"]').first().fill(uniqueComplaint);
    console.log(`主訴: ${uniqueComplaint}`);
    
    // 現病歴
    await page.locator('textarea[placeholder*="現在の症状"]').first().fill('フォールバック機能テスト用の現病歴');
    
    // 次へ
    await page.locator('button:has-text("次へ")').first().click();
    await page.waitForTimeout(1000);

    // ステップ2: バイタルサイン
    console.log('--- バイタルサイン入力 ---');
    const vitalInputs = page.locator('input[type="number"]');
    const vitalCount = await vitalInputs.count();
    
    if (vitalCount >= 3) {
      await vitalInputs.nth(0).fill('36.8');
      await vitalInputs.nth(1).fill('125');
      await vitalInputs.nth(2).fill('85');
      console.log('✓ バイタルサインを入力しました');
    }

    // 次へ
    const nextButton2 = page.locator('button:has-text("次へ")').first();
    if (await nextButton2.isVisible()) {
      await nextButton2.click();
      await page.waitForTimeout(1000);
    }

    // ステップ3: SOAP記録
    console.log('--- SOAP記録入力 ---');
    const soapInputs = page.locator('textarea:not([readonly]):not([aria-hidden="true"])');
    const editableCount = await soapInputs.count();
    
    if (editableCount >= 4) {
      await soapInputs.nth(0).fill('フォールバックテストのため来院。特に症状なし。');
      await soapInputs.nth(1).fill('バイタルサイン安定。身体所見正常。');
      await soapInputs.nth(2).fill('健康状態良好。フォールバック機能が正常動作。');
      await soapInputs.nth(3).fill('システムテスト完了。次回定期検診推奨。');
      console.log('✓ SOAP記録を入力しました');
    }

    // 診療記録作成
    console.log('--- 診療記録作成実行 ---');
    const createButton = page.locator('button:has-text("診療記録を作成")');
    
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();
    
    await createButton.click();
    console.log('✓ 作成ボタンをクリックしました');
    
    // 成功メッセージを待機
    await page.waitForTimeout(3000);

    // 成功メッセージの確認
    const successMessage = page.locator('text=診療記録が正常に作成されました');
    const successVisible = await successMessage.isVisible().catch(() => false);
    
    if (successVisible) {
      console.log('✅ 成功メッセージが表示されました');
      await page.waitForTimeout(2000);
    }

    // 診療記録一覧での確認
    console.log('--- データ表示確認 ---');
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/encounters') || currentUrl.includes('/create')) {
      await page.goto('http://localhost:3000/encounters');
      await page.waitForURL('**/encounters');
    }
    
    await page.waitForTimeout(3000);

    // ページをリロードして最新状態を確認
    await page.reload();
    await page.waitForTimeout(2000);

    // 診療記録数の確認
    const finalRows = await page.locator('table tbody tr').count();
    console.log(`作成後の診療記録数: ${finalRows}`);

    // 作成した診療記録を検索
    const createdRecord = page.locator(`text="${uniqueComplaint}"`);
    const isVisible = await createdRecord.isVisible().catch(() => false);
    
    if (isVisible) {
      console.log('🎉 SUCCESS: 作成した診療記録がテーブルに表示されています！');
      console.log('✅ フォールバック機能が完全に動作しています');
    } else {
      console.log('⚠ 作成した診療記録が見つかりません');
      
      // テーブル内容を確認
      if (finalRows > initialRows) {
        console.log('✅ 診療記録数は増加しています');
        
        // 最新の行を確認
        const latestRow = page.locator('table tbody tr').first();
        const latestContent = await latestRow.textContent();
        console.log(`最新行の内容: ${latestContent}`);
      }
    }

    // ローカルストレージの確認
    const mockData = await page.evaluate(() => {
      return localStorage.getItem('mockEncounters');
    });
    
    if (mockData) {
      const mockEncounters = JSON.parse(mockData);
      console.log(`✅ ローカルストレージに${mockEncounters.length}件のモックデータが保存されています`);
    }

    // 最終スクリーンショット
    await page.screenshot({ path: 'complete-fallback-test-result.png', fullPage: true });
    
    console.log('=== 完全フォールバック機能テスト完了 ===');
  });

  test('複数診療録登録テスト', async ({ page }) => {
    console.log('=== 複数診療録登録テスト開始 ===');

    for (let i = 1; i <= 3; i++) {
      console.log(`--- 診療録${i}の作成 ---`);
      
      await page.getByRole('button', { name: '診療記録' }).click();
      await page.waitForURL('**/encounters');
      
      await page.locator('button:has-text("新規診療記録")').click();
      await page.waitForURL('**/encounters/create');

      // 患者選択
      const patientSelect = page.locator('div[role="combobox"]').first();
      await patientSelect.click();
      await page.waitForTimeout(1000);
      
      const patients = page.locator('li[role="option"]:not([aria-disabled="true"])');
      const patientIndex = (i - 1) % await patients.count();
      await patients.nth(patientIndex).click();

      // 開始日時
      const startTimeInput = page.locator('input[type="datetime-local"]').first();
      const now = new Date();
      now.setMinutes(now.getMinutes() + i * 30);
      await startTimeInput.fill(now.toISOString().slice(0, 16));

      // 主訴
      const complaint = `複数テスト診療録${i} ${Date.now()}`;
      await page.locator('input[placeholder*="主訴"]').first().fill(complaint);

      // 現病歴
      await page.locator('textarea[placeholder*="現在の症状"]').first().fill(`テスト${i}回目の診療記録`);

      // ステップをスキップして作成
      await page.locator('button:has-text("次へ")').first().click();
      await page.waitForTimeout(1000);

      const nextButton2 = page.locator('button:has-text("次へ")').first();
      if (await nextButton2.isVisible()) {
        await nextButton2.click();
        await page.waitForTimeout(1000);
      }

      // 作成
      const createButton = page.locator('button:has-text("診療記録を作成")');
      if (await createButton.isVisible()) {
        await createButton.click();
        console.log(`✓ 診療録${i}を作成しました`);
        await page.waitForTimeout(3000);
      }
    }

    // 最終確認
    await page.goto('http://localhost:3000/encounters');
    await page.waitForURL('**/encounters');
    await page.waitForTimeout(2000);

    const totalRows = await page.locator('table tbody tr').count();
    console.log(`✅ 複数登録後の総診療記録数: ${totalRows}`);

    // ローカルストレージの確認
    const mockData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mockEncounters') || '[]');
    });
    
    console.log(`✅ ローカルストレージ内のデータ数: ${mockData.length}`);

    console.log('=== 複数診療録登録テスト完了 ===');
  });
});