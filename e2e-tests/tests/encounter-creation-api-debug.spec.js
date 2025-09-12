/**
 * Encounter Creation API Debug Test  
 * 診療記録作成時のAPI呼び出し詳細デバッグ
 */

const { test, expect } = require('@playwright/test');

test.describe('Encounter Creation API Debug', () => {

  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'demo');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Debug Encounter Creation API Calls', async ({ page }) => {
    console.log('=== 診療記録作成API詳細デバッグ開始 ===');

    // ネットワーク監視設定
    const apiCalls = [];
    const errors = [];
    
    page.on('request', request => {
      if (request.url().includes('/encounters') && request.method() === 'POST') {
        console.log(`📤 POST Request: ${request.url()}`);
        console.log(`Headers: ${JSON.stringify(request.headers())}`);
        request.postData().then(data => {
          console.log(`Post Data: ${data}`);
        });
      }
    });
    
    page.on('response', async response => {
      if (response.url().includes('/encounters') && response.request().method() === 'POST') {
        console.log(`📥 POST Response: ${response.status()} ${response.url()}`);
        
        const responseData = {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        };
        
        try {
          if (response.status() >= 400) {
            const errorBody = await response.text();
            responseData.error = errorBody;
            console.log(`❌ Error Response Body: ${errorBody}`);
            errors.push(responseData);
          } else {
            const successBody = await response.json();
            responseData.data = successBody;
            console.log(`✅ Success Response: ${JSON.stringify(successBody, null, 2)}`);
          }
        } catch (e) {
          console.log(`⚠️ Failed to parse response body: ${e.message}`);
        }
        
        apiCalls.push(responseData);
      }
    });

    // Console error monitoring  
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🖥️ Console Error: ${msg.text()}`);
      }
      if (msg.text().includes('API error') || msg.text().includes('フォールバック')) {
        console.log(`🚨 Important Log: ${msg.text()}`);
      }
    });

    // 診療記録作成ページに移動
    await page.goto('http://localhost:3000/encounters/create');
    await page.waitForLoadState('networkidle');

    console.log('--- 診療記録データ入力 ---');
    
    // 患者選択
    await page.click('.MuiSelect-select');
    await page.waitForTimeout(500);
    await page.click('li[role="option"]:first-child');
    
    // 基本情報入力
    const testData = {
      datetime: '2025-07-02T16:00',
      chiefComplaint: 'APIテスト用主訴',
      history: 'APIテスト用現病歴'
    };
    
    await page.fill('input[type="datetime-local"]', testData.datetime);
    await page.fill('input[placeholder="患者の主訴を入力してください"]', testData.chiefComplaint);
    await page.fill('textarea[placeholder="現在の症状の経過を入力してください"]', testData.history);
    
    // 次のステップへ
    await page.click('button:has-text("次へ")');
    await page.waitForTimeout(1000);

    // バイタルサイン
    const temperatureInput = page.locator('input[type="number"]').first();
    if (await temperatureInput.isVisible()) {
      await temperatureInput.fill('37.5');
    }
    
    await page.click('button:has-text("次へ")');
    await page.waitForTimeout(1000);

    // SOAP記録
    await page.fill('textarea[placeholder*="患者の訴え"]', 'API test subjective');
    await page.fill('textarea[placeholder*="身体所見"]', 'API test objective');
    await page.fill('textarea[placeholder*="診断"]', 'API test assessment');
    await page.fill('textarea[placeholder*="治療計画"]', 'API test plan');

    console.log('--- 診療記録保存実行 ---');
    
    // 保存ボタンクリック
    const saveButton = page.locator('button:has-text("診療記録を作成")');
    await saveButton.click();
    
    // API呼び出し完了まで待機
    console.log('API呼び出し完了まで待機中...');
    await page.waitForTimeout(5000);
    
    // 結果分析
    console.log('=== API呼び出し結果分析 ===');
    console.log(`POST API呼び出し数: ${apiCalls.length}`);
    console.log(`エラー数: ${errors.length}`);
    
    if (apiCalls.length > 0) {
      apiCalls.forEach((call, index) => {
        console.log(`\n--- API Call ${index + 1} ---`);
        console.log(`Status: ${call.status}`);
        console.log(`Time: ${call.timestamp}`);
        
        if (call.status >= 400) {
          console.log(`❌ Error: ${call.error}`);
        } else if (call.data) {
          console.log(`✅ Success: ID=${call.data.id}, EncounterID=${call.data.encounter_id}`);
        }
      });
    } else {
      console.log('⚠️ POST API呼び出しが検出されませんでした');
    }

    // 成功メッセージ確認
    const successMessage = page.locator('text=診療記録が正常に作成されました');
    if (await successMessage.isVisible()) {
      console.log('✅ 成功メッセージが表示されました');
    } else {
      console.log('❌ 成功メッセージが表示されませんでした');
    }

    // localStorage確認
    const localStorageData = await page.evaluate(() => {
      const mockData = localStorage.getItem('mockEncounters');
      return mockData ? JSON.parse(mockData) : null;
    });
    
    if (localStorageData && localStorageData.length > 0) {
      console.log(`📦 LocalStorage内の診療記録数: ${localStorageData.length}`);
      const latest = localStorageData[localStorageData.length - 1];
      console.log(`Latest Mock Encounter: ${latest.chief_complaint}`);
    } else {
      console.log('📦 LocalStorageにデータがありません');
    }

    console.log('=== 診療記録作成API詳細デバッグ完了 ===');
  });

  test('Direct API Test - Create Encounter', async ({ request }) => {
    console.log('=== 直接API呼び出しテスト（診療記録作成） ===');
    
    // 認証
    const authResponse = await request.post('http://localhost:8000/api/v1/auth/login', {
      data: {
        username: 'demo',
        password: 'demo123'
      }
    });
    
    if (!authResponse.ok()) {
      console.log('❌ 認証失敗');
      return;
    }
    
    const authData = await authResponse.json();
    const token = authData.access_token;
    console.log('✅ 認証成功');

    // 診療記録作成API直接呼び出し
    const encounterData = {
      patient_id: 1,
      practitioner_id: 1,
      status: 'planned',
      encounter_class: 'ambulatory',
      start_time: new Date().toISOString(),
      end_time: null,
      chief_complaint: '直接API呼び出しテスト用主訴',
      history_present_illness: '直接API呼び出しテスト用現病歴',
      physical_examination: null,
      diagnosis_codes: null,
      notes: null,
      temperature: 37.5,
      blood_pressure_systolic: 120,
      blood_pressure_diastolic: 80,
      heart_rate: 75,
      respiratory_rate: 16,
      oxygen_saturation: 98.0,
      height: 170.0,
      weight: 65.0,
      subjective: '直接API subjective',
      objective: '直接API objective', 
      assessment: '直接API assessment',
      plan: '直接API plan'
    };
    
    console.log('📤 診療記録作成API呼び出し');
    console.log(`Data: ${JSON.stringify(encounterData, null, 2)}`);
    
    const createResponse = await request.post('http://localhost:8000/api/v1/encounters/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: encounterData
    });
    
    console.log(`📥 Response Status: ${createResponse.status()}`);
    
    if (createResponse.ok()) {
      const responseData = await createResponse.json();
      console.log('✅ 診療記録作成成功');
      console.log(`Created ID: ${responseData.id}`);
      console.log(`Encounter ID: ${responseData.encounter_id}`);
      console.log(`Chief Complaint: ${responseData.chief_complaint}`);
    } else {
      const errorData = await createResponse.text();
      console.log('❌ 診療記録作成失敗');
      console.log(`Error: ${errorData}`);
    }

    console.log('=== 直接API呼び出しテスト完了 ===');
  });
});