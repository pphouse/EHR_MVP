const { test, expect } = require('@playwright/test');

test.describe('最終確認: 実際のデータで診療録登録', () => {
  let createdPatientId = null;

  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('http://localhost:3000');
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
  });

  test('完全な患者登録→診療録登録→データ確認フロー', async ({ page }) => {
    console.log('=== 完全データフロー確認テスト開始 ===');

    // 1. 患者作成
    console.log('--- ステップ1: 患者作成 ---');
    await page.getByRole('button', { name: '患者管理' }).click();
    await page.waitForURL('**/patients');
    
    await page.locator('button:has-text("新規患者登録")').click();
    await page.waitForURL('**/patients/create');
    
    const patientData = {
      lastName: '最終テスト',
      firstName: '患者',
      lastNameKana: 'サイシュウテスト',
      firstNameKana: 'カンジャ',
      phone: '090-9999-8888',
      dateOfBirth: '1985-06-15'
    };
    
    await page.locator('input[name="lastName"]').fill(patientData.lastName);
    await page.locator('input[name="firstName"]').fill(patientData.firstName);
    await page.locator('input[name="lastNameKana"]').fill(patientData.lastNameKana);
    await page.locator('input[name="firstNameKana"]').fill(patientData.firstNameKana);
    await page.locator('input[name="phone"]').fill(patientData.phone);
    await page.locator('input[name="dateOfBirth"]').fill(patientData.dateOfBirth);
    
    await page.locator('div[data-testid="gender-select"]').click();
    await page.locator('[data-value="female"]').click();
    
    await page.locator('button[type="submit"]:has-text("保存")').click();
    await page.waitForTimeout(3000);
    console.log('✓ 患者作成完了');

    // 患者が作成されたか確認
    await page.goto('http://localhost:3000/patients');
    await page.waitForURL('**/patients');
    await page.waitForTimeout(2000);
    
    const patientInList = page.locator(`text="${patientData.lastName} ${patientData.firstName}"`);
    const patientExists = await patientInList.isVisible().catch(() => false);
    console.log(`患者リスト確認: ${patientExists ? '表示あり' : '表示なし'}`);

    // 2. 診療記録作成
    console.log('--- ステップ2: 診療記録作成 ---');
    await page.getByRole('button', { name: '診療記録' }).click();
    await page.waitForURL('**/encounters');
    
    await page.locator('button:has-text("新規診療記録")').click();
    await page.waitForURL('**/encounters/create');

    // ネットワーク監視を開始
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/v1/')) {
        apiCalls.push({
          url: response.url(),
          method: response.request().method(),
          status: response.status(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // 基本情報入力
    console.log('--- 基本情報入力 ---');
    
    // 患者選択
    const patientSelect = page.locator('div[role="combobox"]').first();
    await patientSelect.click();
    await page.waitForTimeout(1000);
    
    // 実際の患者を選択
    const availablePatients = page.locator('li[role="option"]:not([aria-disabled="true"])');
    const patientCount = await availablePatients.count();
    console.log(`利用可能な患者数: ${patientCount}`);
    
    if (patientCount > 0) {
      // 最新の患者（最後に作成した患者）を選択
      await availablePatients.last().click();
      console.log('✓ 患者を選択しました');
    } else {
      console.log('❌ 利用可能な患者がありません');
      return;
    }

    // 開始日時
    const startTimeInput = page.locator('input[type="datetime-local"]').first();
    const now = new Date();
    const formattedTime = now.toISOString().slice(0, 16);
    await startTimeInput.fill(formattedTime);
    
    // 主訴
    const uniqueComplaint = `最終テスト診療録 ${Date.now()}`;
    await page.locator('input[placeholder*="主訴"]').first().fill(uniqueComplaint);
    console.log(`主訴: ${uniqueComplaint}`);
    
    // 現病歴
    await page.locator('textarea[placeholder*="現在の症状"]').first().fill('最終テスト用の現病歴記録');
    
    // 次へ
    await page.locator('button:has-text("次へ")').first().click();
    await page.waitForTimeout(1000);

    // ステップ2をスキップして直接作成
    const nextButton2 = page.locator('button:has-text("次へ")').first();
    if (await nextButton2.isVisible()) {
      await nextButton2.click();
      await page.waitForTimeout(1000);
    }

    // 診療記録作成
    console.log('--- 診療記録作成実行 ---');
    const createButton = page.locator('button:has-text("診療記録を作成")');
    
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();
    
    await createButton.click();
    console.log('✓ 作成ボタンをクリックしました');
    
    // API完了を待機
    await page.waitForTimeout(5000);

    // 3. API呼び出し結果の詳細分析
    console.log('--- API呼び出し分析 ---');
    const encounterCalls = apiCalls.filter(call => 
      call.url.includes('/encounters') && call.method === 'POST'
    );
    
    for (const call of encounterCalls) {
      console.log(`POST ${call.url} - Status: ${call.status} at ${call.timestamp}`);
    }

    // 4. 診療記録一覧での確認
    console.log('--- データ永続化確認 ---');
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/encounters') || currentUrl.includes('/create')) {
      await page.goto('http://localhost:3000/encounters');
      await page.waitForURL('**/encounters');
    }
    
    await page.waitForTimeout(3000);

    // リロードして最新データを取得
    await page.reload();
    await page.waitForTimeout(2000);

    // 診療記録の存在確認
    const encounterRows = await page.locator('table tbody tr').count();
    console.log(`診療記録総数: ${encounterRows}`);

    // 作成した診療記録を検索
    const createdRecord = page.locator(`text="${uniqueComplaint}"`);
    const isVisible = await createdRecord.isVisible().catch(() => false);
    
    if (isVisible) {
      console.log('🎉 SUCCESS: 作成した診療記録がテーブルに表示されています！');
    } else {
      console.log('❌ 作成した診療記録が見つかりません');
      
      // テーブル内容を詳細確認
      if (encounterRows > 0) {
        console.log('--- テーブル内容確認 ---');
        for (let i = 0; i < Math.min(encounterRows, 5); i++) {
          const row = page.locator('table tbody tr').nth(i);
          const content = await row.textContent();
          console.log(`行${i + 1}: ${content}`);
        }
      }
    }

    // 5. 最終確認
    console.log('--- 最終確認 ---');
    
    // 全てのAPI呼び出しのサマリー
    const successfulCalls = apiCalls.filter(call => call.status >= 200 && call.status < 300);
    const failedCalls = apiCalls.filter(call => call.status >= 400);
    
    console.log(`成功したAPI呼び出し: ${successfulCalls.length}`);
    console.log(`失敗したAPI呼び出し: ${failedCalls.length}`);
    
    if (failedCalls.length > 0) {
      console.log('失敗したAPI:');
      failedCalls.forEach(call => {
        console.log(`  ${call.method} ${call.url} - ${call.status}`);
      });
    }

    // スクリーンショット保存
    await page.screenshot({ path: 'final-encounter-test-result.png', fullPage: true });
    
    console.log('=== 完全データフロー確認テスト完了 ===');
  });
});