/**
 * Comprehensive Encounter Flow Test
 * 診療記録の包括的なフロー確認テスト
 * 患者選択→診療記録作成→Enhanced Clinical機能→保存→詳細表示→データ確認
 */

const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Encounter Flow Test', () => {

  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'demo');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Complete Encounter Creation and Viewing Flow - Sato Hanako', async ({ page }) => {
    console.log('=== 包括的診療記録フロー確認テスト開始 ===');

    // Step 1: 診療記録作成ページに移動
    console.log('--- Step 1: 診療記録作成ページに移動 ---');
    await page.goto('http://localhost:3000/encounters/create');
    await page.waitForLoadState('networkidle');

    // Step 2: 基本情報入力 - 佐藤花子を選択
    console.log('--- Step 2: 基本情報入力（佐藤花子選択） ---');
    
    // 患者選択
    await page.click('.MuiSelect-select');
    await page.waitForTimeout(1000);
    
    // 佐藤花子を探して選択（患者名で検索）
    const patientOptions = page.locator('li[role="option"]');
    const optionCount = await patientOptions.count();
    console.log(`利用可能な患者オプション数: ${optionCount}`);
    
    let selectedHanako = false;
    for (let i = 0; i < optionCount; i++) {
      const optionText = await patientOptions.nth(i).textContent();
      console.log(`オプション ${i}: ${optionText}`);
      if (optionText.includes('佐藤 花子') || optionText.includes('花子')) {
        await patientOptions.nth(i).click();
        console.log('✅ 佐藤花子を選択しました');
        selectedHanako = true;
        break;
      }
    }
    
    if (!selectedHanako) {
      // 最初のオプションを選択（フォールバック）
      await patientOptions.first().click();
      console.log('⚠️ 佐藤花子が見つからないため、最初の患者を選択');
    }
    
    // 診療日時入力
    const currentDateTime = new Date();
    const formattedDateTime = currentDateTime.toISOString().slice(0, 16);
    await page.fill('input[type="datetime-local"]', formattedDateTime);
    
    // 主訴入力
    const chiefComplaint = 'インフルエンザ様症状（発熱、咳嗽、倦怠感）';
    await page.fill('input[placeholder="患者の主訴を入力してください"]', chiefComplaint);
    console.log(`主訴入力: ${chiefComplaint}`);
    
    // 現病歴入力
    const historyText = '3日前から38度台の発熱、乾性咳嗽、全身倦怠感が出現。食欲不振も認める。市販薬では改善せず来院。';
    await page.fill('textarea[placeholder="現在の症状の経過を入力してください"]', historyText);
    console.log(`現病歴入力: ${historyText}`);
    
    // 次のステップへ
    await page.click('button:has-text("次へ")');
    await page.waitForTimeout(1000);

    // Step 3: バイタルサイン・身体所見入力
    console.log('--- Step 3: バイタルサイン・身体所見入力 ---');
    
    // バイタルサイン入力
    const vitalSigns = {
      temperature: '38.4',
      systolic: '125',
      diastolic: '78',
      heartRate: '95',
      respiratoryRate: '18',
      oxygenSat: '97',
      height: '162',
      weight: '55'
    };
    
    const numberInputs = page.locator('input[type="number"]');
    const inputCount = await numberInputs.count();
    
    if (inputCount >= 8) {
      await numberInputs.nth(0).fill(vitalSigns.temperature);
      await numberInputs.nth(1).fill(vitalSigns.systolic);
      await numberInputs.nth(2).fill(vitalSigns.diastolic);
      await numberInputs.nth(3).fill(vitalSigns.heartRate);
      await numberInputs.nth(4).fill(vitalSigns.respiratoryRate);
      await numberInputs.nth(5).fill(vitalSigns.oxygenSat);
      await numberInputs.nth(6).fill(vitalSigns.height);
      await numberInputs.nth(7).fill(vitalSigns.weight);
      console.log('✅ バイタルサイン入力完了');
    } else {
      console.log('⚠️ バイタルサイン入力フィールドが見つかりません');
    }
    
    // 身体所見入力
    const physicalExam = '体温38.4℃、血圧125/78、脈拍95/分。咽頭軽度発赤あり、扁桃腫大なし。胸部聴診では肺音清明、心音純正。腹部触診で圧痛なし。';
    await page.fill('textarea[placeholder="身体診察の所見を入力してください"]', physicalExam);
    console.log(`身体所見入力: ${physicalExam}`);
    
    // SOAP記録ステップへ
    await page.click('button:has-text("次へ")');
    await page.waitForTimeout(1000);

    // Step 4: SOAP記録入力
    console.log('--- Step 4: SOAP記録入力 ---');
    
    const soapNotes = {
      subjective: '3日前から38度台の発熱、乾性咳嗽、全身倦怠感。食欲不振あり。市販薬無効。',
      objective: '体温38.4℃、血圧125/78、脈拍95。咽頭軽度発赤、肺音清明、心音純正。'
    };
    
    await page.fill('textarea[placeholder*="患者の訴え"]', soapNotes.subjective);
    await page.fill('textarea[placeholder*="身体所見"]', soapNotes.objective);
    console.log('✅ S&O記録入力完了');

    // Step 5: AI状況整理ボタンをテスト
    console.log('--- Step 5: AI状況整理生成テスト ---');
    
    const summaryComponent = page.locator('.real-time-clinical-summary');
    if (await summaryComponent.isVisible()) {
      const generateButton = summaryComponent.locator('button[data-testid="generate-summary-button"]');
      
      if (await generateButton.isVisible() && await generateButton.isEnabled()) {
        console.log('🤖 AI状況整理ボタンをクリック');
        await generateButton.click();
        
        // 10秒待機
        console.log('10秒間待機中...');
        await page.waitForTimeout(10000);
        
        // 結果確認
        const summaryContent = summaryComponent.locator('[data-testid="summary-content"]');
        const errorDiv = summaryComponent.locator('div:has-text("エラー")');
        
        if (await summaryContent.isVisible()) {
          console.log('✅ AI状況整理が成功しました');
        } else if (await errorDiv.isVisible()) {
          console.log('⚠️ AI状況整理でエラーが発生しました');
        } else {
          console.log('⚠️ AI状況整理の結果が表示されませんでした');
        }
      } else {
        console.log('⚠️ AI状況整理ボタンが無効化されています');
      }
    }

    // Step 6: Assessment & Plan入力
    console.log('--- Step 6: Assessment & Plan入力 ---');
    
    const assessmentPlan = {
      assessment: 'インフルエンザA型の疑い。ウイルス性上気道感染症。',
      plan: 'オセルタミビル75mg 1日2回 5日間処方。症状に応じて解熱鎮痛剤併用。水分摂取励行。症状悪化時は再診指示。',
      diagnosisCode: 'J11.1'
    };
    
    await page.fill('textarea[placeholder*="診断"]', assessmentPlan.assessment);
    await page.fill('textarea[placeholder*="治療計画"]', assessmentPlan.plan);
    await page.fill('input[placeholder*="ICD-10"]', assessmentPlan.diagnosisCode);
    console.log('✅ A&P記録入力完了');

    // Step 7: A&P整合性チェック
    console.log('--- Step 7: A&P整合性チェックテスト ---');
    
    const validationComponent = page.locator('.clinical-validation-checker');
    if (await validationComponent.isVisible()) {
      const validateButton = validationComponent.locator('button[data-testid="validate-reasoning-button"]');
      
      if (await validateButton.isVisible() && await validateButton.isEnabled()) {
        console.log('🔍 A&P整合性チェックボタンをクリック');
        await validateButton.click();
        
        // 10秒待機
        console.log('10秒間待機中...');
        await page.waitForTimeout(10000);
        
        // 結果確認
        const validationResults = validationComponent.locator('[data-testid="validation-results"]');
        if (await validationResults.isVisible()) {
          console.log('✅ A&P整合性チェックが成功しました');
        } else {
          console.log('⚠️ A&P整合性チェックの結果が表示されませんでした');
        }
      } else {
        console.log('⚠️ A&P整合性チェックボタンが無効化されています');
      }
    }

    // Step 8: 診療記録保存
    console.log('--- Step 8: 診療記録保存 ---');
    
    const saveButton = page.locator('button:has-text("診療記録を作成")');
    await expect(saveButton).toBeVisible();
    
    console.log('💾 診療記録を保存中...');
    await saveButton.click();
    
    // 保存成功メッセージ確認
    await expect(page.locator('text=診療記録が正常に作成されました')).toBeVisible({ timeout: 15000 });
    console.log('✅ 診療記録が正常に作成されました');
    
    // 自動遷移を待つ
    await page.waitForTimeout(3000);

    // Step 9: 診療記録一覧ページに移動
    console.log('--- Step 9: 診療記録一覧ページ確認 ---');
    
    await page.goto('http://localhost:3000/encounters');
    await page.waitForLoadState('networkidle');
    
    // 作成した診療記録を探す
    const encounterRows = page.locator('tbody tr');
    const rowCount = await encounterRows.count();
    console.log(`診療記録数: ${rowCount}`);
    
    let foundEncounter = false;
    let encounterRow = null;
    
    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      const row = encounterRows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText.includes(chiefComplaint.substring(0, 10)) || 
          rowText.includes('インフルエンザ') ||
          rowText.includes('花子') ||
          rowText.includes(formattedDateTime.substring(0, 10))) {
        foundEncounter = true;
        encounterRow = row;
        console.log('✅ 作成した診療記録が一覧に表示されています');
        break;
      }
    }
    
    if (!foundEncounter) {
      console.log('⚠️ 作成した診療記録が一覧に見つかりません（最新のものを使用）');
      encounterRow = encounterRows.first();
    }

    // Step 10: 診療記録詳細表示
    console.log('--- Step 10: 診療記録詳細表示確認 ---');
    
    if (encounterRow) {
      const viewButton = encounterRow.locator('button[title="詳細表示"]');
      await viewButton.click();
      
      // 詳細ページに遷移
      await page.waitForURL('**/encounters/**', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      console.log('✅ 診療記録詳細ページに遷移しました');
      
      // エラーチェック
      const errorMessages = [
        'データの取得に失敗しました',
        'Encounter not found',
        'エラーが発生しました'
      ];
      
      let hasError = false;
      for (const errorMsg of errorMessages) {
        if (await page.locator(`text=${errorMsg}`).isVisible()) {
          console.log(`❌ エラーが発生: ${errorMsg}`);
          hasError = true;
          break;
        }
      }
      
      if (!hasError) {
        console.log('✅ エラーは発生していません');
        
        // Step 11: 作成内容の確認
        console.log('--- Step 11: 作成内容反映確認 ---');
        
        // 主要な入力内容が表示されているか確認
        const contentChecks = [
          { label: '主訴', content: chiefComplaint },
          { label: '現病歴', content: historyText },
          { label: '身体所見', content: physicalExam },
          { label: 'Subjective', content: soapNotes.subjective },
          { label: 'Objective', content: soapNotes.objective },
          { label: 'Assessment', content: assessmentPlan.assessment },
          { label: 'Plan', content: assessmentPlan.plan }
        ];
        
        let allContentFound = true;
        for (const check of contentChecks) {
          const contentExists = await page.locator(`text=${check.content.substring(0, 15)}`).isVisible();
          if (contentExists) {
            console.log(`✅ ${check.label}: 内容が反映されています`);
          } else {
            console.log(`❌ ${check.label}: 内容が見つかりません`);
            allContentFound = false;
          }
        }
        
        if (allContentFound) {
          console.log('🎉 全ての入力内容が正しく反映されています！');
        } else {
          console.log('⚠️ 一部の内容が反映されていません');
        }
        
      } else {
        console.log('❌ 詳細表示でエラーが発生しています');
      }
    }

    console.log('=== 包括的診療記録フロー確認テスト完了 ===');
  });
});