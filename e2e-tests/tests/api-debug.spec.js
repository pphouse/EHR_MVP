const { test, expect } = require('@playwright/test');

test.describe('API詳細デバッグテスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログインして認証トークンを取得
    await page.goto('http://localhost:3000');
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
  });

  test('API構造と認証状態の詳細確認', async ({ page }) => {
    console.log('=== API構造と認証状態確認テスト開始 ===');

    // 認証トークンの確認
    const authToken = await page.evaluate(() => localStorage.getItem('access_token'));
    console.log(`認証トークン: ${authToken ? 'あり' : 'なし'}`);

    if (authToken) {
      console.log(`トークン最初の50文字: ${authToken.substring(0, 50)}...`);
    }

    // 現在のユーザー情報確認
    try {
      const userInfo = await page.evaluate(async () => {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return {
          status: response.status,
          data: await response.text()
        };
      });
      
      console.log(`ユーザー情報API: ${userInfo.status}`);
      console.log(`ユーザー情報: ${userInfo.data}`);
    } catch (error) {
      console.log(`ユーザー情報取得エラー: ${error.message}`);
    }

    // 患者データの詳細確認
    console.log('--- 患者データAPI確認 ---');
    try {
      const patientResponse = await page.evaluate(async () => {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/v1/patients', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          data: await response.text()
        };
      });
      
      console.log(`患者API Status: ${patientResponse.status}`);
      console.log(`患者API Headers: ${JSON.stringify(patientResponse.headers, null, 2)}`);
      console.log(`患者API Response: ${patientResponse.data}`);
    } catch (error) {
      console.log(`患者API確認エラー: ${error.message}`);
    }

    // 診療記録APIの詳細確認
    console.log('--- 診療記録API確認 ---');
    try {
      const encounterResponse = await page.evaluate(async () => {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/v1/encounters/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          data: await response.text()
        };
      });
      
      console.log(`診療記録API Status: ${encounterResponse.status}`);
      console.log(`診療記録API Headers: ${JSON.stringify(encounterResponse.headers, null, 2)}`);
      console.log(`診療記録API Response: ${encounterResponse.data}`);
    } catch (error) {
      console.log(`診療記録API確認エラー: ${error.message}`);
    }

    console.log('=== API構造と認証状態確認テスト完了 ===');
  });

  test('診療記録作成APIのリクエスト詳細確認', async ({ page }) => {
    console.log('=== 診療記録作成APIリクエスト詳細確認テスト開始 ===');

    // ネットワーク監視
    const requestDetails = [];
    const responseDetails = [];

    page.on('request', request => {
      if (request.url().includes('/api/v1/encounters') && request.method() === 'POST') {
        requestDetails.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/v1/encounters') && response.request().method() === 'POST') {
        responseDetails.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers()
        });
      }
    });

    // 診療記録作成ページに移動
    await page.getByRole('button', { name: '診療記録' }).click();
    await page.waitForURL('**/encounters');
    await page.locator('button:has-text("新規診療記録")').click();
    await page.waitForURL('**/encounters/create');

    // 最小限のデータで作成試行
    console.log('--- 最小限データでの作成試行 ---');

    // 患者選択（フォールバックデータを使用）
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
    await startTimeInput.fill('2024-01-15T14:00');

    // 主訴
    await page.locator('input[placeholder*="主訴"]').first().fill('APIテスト用主訴');

    // ステップをスキップして作成
    await page.locator('button:has-text("次へ")').first().click();
    await page.waitForTimeout(1000);

    const nextButton2 = page.locator('button:has-text("次へ")').first();
    if (await nextButton2.isVisible()) {
      await nextButton2.click();
      await page.waitForTimeout(1000);
    }

    // 作成ボタンクリック
    const createButton = page.locator('button:has-text("診療記録を作成")');
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(3000);
    }

    // リクエスト詳細の分析
    console.log('--- リクエスト詳細分析 ---');
    for (const request of requestDetails) {
      console.log(`POST URL: ${request.url}`);
      console.log(`Headers: ${JSON.stringify(request.headers, null, 2)}`);
      console.log(`Post Data: ${request.postData}`);
      
      // POST データをJSONとして解析
      if (request.postData) {
        try {
          const postJson = JSON.parse(request.postData);
          console.log('POST JSON構造:');
          console.log(JSON.stringify(postJson, null, 2));
        } catch (e) {
          console.log('POST データがJSONではありません');
        }
      }
    }

    // レスポンス詳細の分析
    console.log('--- レスポンス詳細分析 ---');
    for (const response of responseDetails) {
      console.log(`Response Status: ${response.status} ${response.statusText}`);
      console.log(`Response Headers: ${JSON.stringify(response.headers, null, 2)}`);
    }

    // バックエンドスキーマと照合
    console.log('--- バックエンドスキーマ確認 ---');
    try {
      const schemaResponse = await page.evaluate(async () => {
        const response = await fetch('/api/v1/docs/openapi.json');
        if (response.ok) {
          const schema = await response.json();
          return schema.components?.schemas?.EncounterCreate || 'スキーマが見つかりません';
        }
        return 'OpenAPIスキーマにアクセスできません';
      });
      
      console.log('EncounterCreateスキーマ:');
      console.log(JSON.stringify(schemaResponse, null, 2));
    } catch (error) {
      console.log(`スキーマ確認エラー: ${error.message}`);
    }

    console.log('=== 診療記録作成APIリクエスト詳細確認テスト完了 ===');
  });
});