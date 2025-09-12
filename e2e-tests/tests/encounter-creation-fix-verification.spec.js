/**
 * Encounter Creation Fix Verification Test
 * 診療記録作成API修正後の検証テスト
 */

const { test, expect } = require('@playwright/test');

test.describe('Encounter Creation Fix Verification', () => {

  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'demo');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Verify Fixed Encounter Creation API', async ({ request }) => {
    console.log('=== 修正後の診療記録作成API検証テスト ===');
    
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

    // 修正前の既存データ確認
    console.log('--- 修正前のデータ確認 ---');
    const beforeResponse = await request.get('http://localhost:8000/api/v1/encounters/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (beforeResponse.ok()) {
      const beforeData = await beforeResponse.json();
      console.log(`修正前の診療記録数: ${beforeData.length}`);
      if (beforeData.length > 0) {
        console.log('既存のEncounter ID:');
        beforeData.forEach(encounter => {
          console.log(`  - ID: ${encounter.id}, Encounter ID: ${encounter.encounter_id}`);
        });
      }
    }

    // 新しい診療記録作成テスト
    console.log('--- 修正後の診療記録作成テスト ---');
    
    const testCases = [
      {
        name: '佐藤花子の診療記録',
        data: {
          patient_id: 2, // 佐藤花子のID
          practitioner_id: 1,
          status: 'planned',
          encounter_class: 'ambulatory',
          start_time: new Date().toISOString(),
          end_time: null,
          chief_complaint: '修正テスト: インフルエンザ様症状',
          history_present_illness: '修正テスト: 3日前から発熱、咳嗽、倦怠感',
          physical_examination: '修正テスト: 体温38.4℃、咽頭発赤軽度',
          diagnosis_codes: 'J11.1',
          notes: '修正テスト用メモ',
          temperature: 38.4,
          blood_pressure_systolic: 125,
          blood_pressure_diastolic: 78,
          heart_rate: 95,
          respiratory_rate: 18,
          oxygen_saturation: 97.0,
          height: 162.0,
          weight: 55.0,
          subjective: '修正テスト: 発熱、咳嗽、全身倦怠感',
          objective: '修正テスト: 体温38.4℃、血圧125/78、脈拍95',
          assessment: '修正テスト: インフルエンザA型の疑い',
          plan: '修正テスト: オセルタミビル処方、対症療法'
        }
      },
      {
        name: '田中太郎の診療記録',
        data: {
          patient_id: 1, // 田中太郎のID
          practitioner_id: 1,
          status: 'planned',
          encounter_class: 'ambulatory',
          start_time: new Date().toISOString(),
          end_time: null,
          chief_complaint: '修正テスト: 胃の不調',
          history_present_illness: '修正テスト: 1週間前から胃部不快感',
          physical_examination: '修正テスト: 腹部軽度圧痛',
          diagnosis_codes: 'K30',
          notes: '修正テスト用メモ2',
          temperature: 36.8,
          blood_pressure_systolic: 120,
          blood_pressure_diastolic: 80,
          heart_rate: 75,
          respiratory_rate: 16,
          oxygen_saturation: 98.0,
          height: 175.0,
          weight: 70.0,
          subjective: '修正テスト: 胃の調子が悪い',
          objective: '修正テスト: 腹部に軽度圧痛',
          assessment: '修正テスト: 機能性ディスペプシア',
          plan: '修正テスト: PPI処方、食事指導'
        }
      }
    ];

    const createdEncounters = [];

    for (const testCase of testCases) {
      console.log(`\n--- ${testCase.name} 作成テスト ---`);
      
      const createResponse = await request.post('http://localhost:8000/api/v1/encounters/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: testCase.data
      });
      
      console.log(`📥 Response Status: ${createResponse.status()}`);
      
      if (createResponse.ok()) {
        const responseData = await createResponse.json();
        console.log('✅ 診療記録作成成功');
        console.log(`  - Created ID: ${responseData.id}`);
        console.log(`  - Encounter ID: ${responseData.encounter_id}`);
        console.log(`  - Chief Complaint: ${responseData.chief_complaint}`);
        console.log(`  - Patient ID: ${responseData.patient_id}`);
        
        createdEncounters.push(responseData);
      } else {
        const errorData = await createResponse.text();
        console.log('❌ 診療記録作成失敗');
        console.log(`  - Error: ${errorData}`);
      }
    }

    // 作成後のデータ確認
    console.log('\n--- 作成後のデータ確認 ---');
    const afterResponse = await request.get('http://localhost:8000/api/v1/encounters/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (afterResponse.ok()) {
      const afterData = await afterResponse.json();
      console.log(`作成後の診療記録数: ${afterData.length}`);
      
      // 新しく作成された診療記録を確認
      const newEncounters = afterData.filter(encounter => 
        createdEncounters.some(created => created.id === encounter.id)
      );
      
      console.log(`新規作成された診療記録: ${newEncounters.length}件`);
      newEncounters.forEach(encounter => {
        console.log(`  ✅ ID: ${encounter.id}, Encounter ID: ${encounter.encounter_id}, 主訴: ${encounter.chief_complaint}`);
      });
    }

    console.log('=== 修正後の診療記録作成API検証テスト完了 ===');
  });

  test('End-to-End Encounter Creation Flow Test', async ({ page }) => {
    console.log('=== エンドツーエンド診療記録作成フローテスト ===');

    // ネットワーク監視
    const apiCalls = [];
    page.on('response', async response => {
      if (response.url().includes('/encounters') && response.request().method() === 'POST') {
        console.log(`📥 POST Response: ${response.status()} ${response.url()}`);
        if (response.ok()) {
          try {
            const data = await response.json();
            console.log(`✅ Created Encounter ID: ${data.encounter_id}`);
            apiCalls.push(data);
          } catch (e) {}
        }
      }
    });

    // 診療記録作成ページに移動
    await page.goto('http://localhost:3000/encounters/create');
    await page.waitForLoadState('networkidle');

    // 佐藤花子を選択
    console.log('--- 佐藤花子の診療記録作成 ---');
    await page.click('.MuiSelect-select');
    await page.waitForTimeout(500);
    
    // 佐藤花子を探して選択
    const options = page.locator('li[role="option"]');
    const optionCount = await options.count();
    for (let i = 0; i < optionCount; i++) {
      const optionText = await options.nth(i).textContent();
      if (optionText.includes('佐藤 花子')) {
        await options.nth(i).click();
        console.log('✅ 佐藤花子を選択');
        break;
      }
    }
    
    // 基本情報入力
    await page.fill('input[type="datetime-local"]', '2025-07-02T17:00');
    await page.fill('input[placeholder="患者の主訴を入力してください"]', 'E2Eテスト: インフルエンザ様症状');
    await page.fill('textarea[placeholder="現在の症状の経過を入力してください"]', 'E2Eテスト: 3日前から発熱と咳嗽');
    
    // 次のステップへ
    await page.click('button:has-text("次へ")');
    await page.waitForTimeout(1000);

    // バイタルサイン入力
    const numberInputs = page.locator('input[type="number"]');
    if (await numberInputs.first().isVisible()) {
      await numberInputs.first().fill('38.2');
    }
    
    await page.click('button:has-text("次へ")');
    await page.waitForTimeout(1000);

    // SOAP記録入力
    await page.fill('textarea[placeholder*="患者の訴え"]', 'E2Eテスト: 発熱、咳嗽');
    await page.fill('textarea[placeholder*="身体所見"]', 'E2Eテスト: 体温38.2℃');
    await page.fill('textarea[placeholder*="診断"]', 'E2Eテスト: インフルエンザ疑い');
    await page.fill('textarea[placeholder*="治療計画"]', 'E2Eテスト: 対症療法');

    // 診療記録保存
    console.log('💾 診療記録を保存');
    await page.click('button:has-text("診療記録を作成")');
    
    // 成功メッセージ確認
    const successMessage = page.locator('text=診療記録が正常に作成されました');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    console.log('✅ 成功メッセージ表示');
    
    // 詳細ページに遷移することを確認
    await page.waitForURL('**/encounters/**', { timeout: 10000 });
    console.log('✅ 詳細ページに遷移');
    
    // 詳細ページでエラーがないことを確認
    const errorMessage = page.locator('text=Encounter not found');
    await expect(errorMessage).not.toBeVisible();
    console.log('✅ "Encounter not found" エラーなし');
    
    // 入力したデータが表示されることを確認
    await expect(page.locator('text=E2Eテスト')).toBeVisible();
    console.log('✅ 入力データが正しく表示');

    console.log('=== エンドツーエンド診療記録作成フローテスト完了 ===');
  });
});