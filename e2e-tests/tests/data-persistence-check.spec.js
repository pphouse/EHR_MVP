const { test, expect } = require('@playwright/test');

test.describe('診療録データ永続化確認テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('http://localhost:3000');
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
  });

  test('診療録登録とデータ永続化の詳細確認', async ({ page }) => {
    console.log('=== 診療録データ永続化確認テスト開始 ===');

    // APIレスポンス監視
    const apiResponses = [];
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/encounters')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
          body: response.text().catch(() => null)
        });
      }
    });

    // 診療記録ページに移動
    await page.getByRole('button', { name: '診療記録' }).click();
    await page.waitForURL('**/encounters');
    
    // 初期の診療記録数を確認
    await page.waitForTimeout(2000);
    const initialRows = await page.locator('table tbody tr').count();
    console.log(`初期の診療記録数: ${initialRows}`);

    // 新規診療記録作成
    await page.locator('button:has-text("新規診療記録")').click();
    await page.waitForURL('**/encounters/create');

    // ステップ1: 基本情報入力
    console.log('--- 基本情報入力 ---');
    
    // 患者選択
    const patientSelect = page.locator('div[role="combobox"]').first();
    await patientSelect.click();
    await page.waitForTimeout(1000);
    
    const firstPatient = page.locator('li[role="option"]:not([aria-disabled="true"])').first();
    await firstPatient.click();
    
    // 開始日時
    const startTimeInput = page.locator('input[type="datetime-local"]').first();
    const uniqueDateTime = new Date();
    uniqueDateTime.setMinutes(uniqueDateTime.getMinutes() - Math.floor(Math.random() * 60));
    await startTimeInput.fill(uniqueDateTime.toISOString().slice(0, 16));
    
    // 主訴
    const uniqueComplaint = `テスト主訴 ${Date.now()}`;
    await page.locator('input[placeholder*="主訴"]').first().fill(uniqueComplaint);
    console.log(`入力した主訴: ${uniqueComplaint}`);
    
    // 現病歴
    await page.locator('textarea[placeholder*="現在の症状"]').first().fill('永続化テスト用の現病歴');
    
    // 次へ
    await page.locator('button:has-text("次へ")').first().click();
    await page.waitForTimeout(1000);

    // ステップ2をスキップ
    const nextButton2 = page.locator('button:has-text("次へ")').first();
    if (await nextButton2.isVisible()) {
      await nextButton2.click();
      await page.waitForTimeout(1000);
    }

    // 診療記録作成
    console.log('--- 診療記録作成実行 ---');
    const createButton = page.locator('button:has-text("診療記録を作成")');
    await createButton.click();
    
    // レスポンス待機
    await page.waitForTimeout(5000);

    // API レスポンスの確認
    console.log('--- APIレスポンス分析 ---');
    for (const response of apiResponses) {
      console.log(`${response.method} ${response.url} - Status: ${response.status}`);
      if (response.body) {
        const bodyText = await response.body;
        if (bodyText && bodyText.length < 500) {
          console.log(`Response body: ${bodyText}`);
        }
      }
    }

    // 診療記録一覧に戻る
    const currentUrl = page.url();
    if (!currentUrl.includes('/encounters') || currentUrl.includes('/create')) {
      await page.goto('http://localhost:3000/encounters');
      await page.waitForURL('**/encounters');
    }
    
    await page.waitForTimeout(3000);

    // 登録後の診療記録数を確認
    const afterRows = await page.locator('table tbody tr').count();
    console.log(`登録後の診療記録数: ${afterRows}`);

    // データ永続化の確認
    console.log('--- データ永続化確認 ---');
    
    // 作成した主訴が表示されているか確認
    const createdRecord = page.locator(`text="${uniqueComplaint}"`);
    const isRecordVisible = await createdRecord.isVisible().catch(() => false);
    
    if (isRecordVisible) {
      console.log('✅ 作成した診療記録が一覧に表示されています');
    } else {
      console.log('❌ 作成した診療記録が一覧に表示されていません');
      
      // テーブル内容の詳細確認
      const tableContent = await page.locator('table').textContent();
      console.log('テーブル内容:', tableContent);
    }

    // ページリロードして永続化確認
    console.log('--- ページリロード後の永続化確認 ---');
    await page.reload();
    await page.waitForTimeout(2000);
    
    const reloadedRows = await page.locator('table tbody tr').count();
    console.log(`リロード後の診療記録数: ${reloadedRows}`);
    
    const isRecordVisibleAfterReload = await createdRecord.isVisible().catch(() => false);
    if (isRecordVisibleAfterReload) {
      console.log('✅ リロード後も診療記録が表示されています');
    } else {
      console.log('❌ リロード後に診療記録が消えました');
    }

    // スクリーンショット保存
    await page.screenshot({ path: 'data-persistence-result.png', fullPage: true });
    
    console.log('=== 診療録データ永続化確認テスト完了 ===');
  });

  test('バックエンドAPI直接確認', async ({ page }) => {
    console.log('=== バックエンドAPI直接確認テスト開始 ===');

    // 診療記録一覧APIを直接呼び出し
    try {
      const response = await page.evaluate(async () => {
        const token = localStorage.getItem('access_token');
        const res = await fetch('http://localhost:8000/api/v1/encounters/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return {
          status: res.status,
          data: await res.text()
        };
      });
      
      console.log(`API Status: ${response.status}`);
      console.log(`API Response: ${response.data}`);
      
      if (response.status === 200) {
        const data = JSON.parse(response.data);
        console.log(`診療記録数: ${Array.isArray(data) ? data.length : 'N/A'}`);
      }
    } catch (error) {
      console.log(`API確認エラー: ${error.message}`);
    }

    // 患者一覧APIも確認
    try {
      const patientResponse = await page.evaluate(async () => {
        const token = localStorage.getItem('access_token');
        const res = await fetch('http://localhost:8000/api/v1/patients/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return {
          status: res.status,
          data: await res.text()
        };
      });
      
      console.log(`Patient API Status: ${patientResponse.status}`);
      if (patientResponse.status === 200) {
        const data = JSON.parse(patientResponse.data);
        console.log(`患者数: ${Array.isArray(data) ? data.length : 'N/A'}`);
      }
    } catch (error) {
      console.log(`Patient API確認エラー: ${error.message}`);
    }

    console.log('=== バックエンドAPI直接確認テスト完了 ===');
  });
});