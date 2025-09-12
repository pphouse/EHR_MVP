const { test, expect } = require('@playwright/test');

test.describe('Enhanced Clinical Assistant Tests', () => {
  
  // ヘルパー関数：認証トークンを取得
  async function getAuthToken() {
    const response = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'demo',
        password: 'demo123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    }
    throw new Error('Failed to get auth token');
  }

  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'demo');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Enhanced PII Detection API Test', async ({ request }) => {
    console.log('=== Enhanced PII Detection テスト開始 ===');
    
    const authToken = await getAuthToken();

    const testCases = [
      {
        name: 'Azure OpenAI PII検知テスト',
        text: '患者の田中太郎さん（患者番号：P123456、電話番号：090-1234-5678）は38歳男性で、東京都渋谷区神宮前1-1-1に住んでいます。',
        medical_context: true,
        masking_level: 'standard',
        expectedTypes: ['name', 'patient_id', 'phone', 'address']
      },
      {
        name: '医療文脈理解テスト',
        text: '患者は上気道炎と診断されています。ペニシリンアレルギーがあり、アセトアミノフェン500mgを処方しました。',
        medical_context: true,
        masking_level: 'minimal',
        expectedTypes: [] // 医学用語なのでPII検知されないはず
      },
      {
        name: '最大マスキングテスト',
        text: '佐藤花子さん（生年月日：1985年3月15日）の検査結果をお送りします。',
        medical_context: true,
        masking_level: 'maximum',
        expectedTypes: ['name', 'birth_date']
      }
    ];

    for (const testCase of testCases) {
      console.log(`--- ${testCase.name} ---`);
      
      const response = await request.post('http://localhost:8000/api/v1/enhanced-clinical/enhanced-pii-detection', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        data: {
          text: testCase.text,
          medical_context: testCase.medical_context,
          masking_level: testCase.masking_level
        }
      });

      expect(response.status()).toBe(200);
      
      const result = await response.json();
      console.log(`元のテキスト: ${result.original_text}`);
      console.log(`マスキング後: ${result.masked_text}`);
      console.log(`マスキングレベル: ${result.masking_level}`);
      console.log(`検知方法: ${result.processing_method}`);
      console.log(`検知されたPII数: ${result.detections.length}`);
      console.log(`リスクレベル: ${result.risk_analysis.risk_level}`);

      // アサーション
      expect(result.status).toBe('success');
      expect(result.masked_text).not.toBe(result.original_text);
      expect(Array.isArray(result.detections)).toBe(true);
      expect(result.risk_analysis).toHaveProperty('overall_risk_score');
      expect(result.risk_analysis).toHaveProperty('recommendations');

      // 期待されるPIIタイプの確認
      if (testCase.expectedTypes.length > 0) {
        const detectedTypes = result.detections.map(d => d.type);
        testCase.expectedTypes.forEach(expectedType => {
          expect(detectedTypes).toContain(expectedType);
        });
        console.log('✅ 期待されるPIIタイプが正しく検知されました');
      } else {
        expect(result.detections.length).toBe(0);
        console.log('✅ 医学用語が適切に除外されました');
      }

      console.log('');
    }

    console.log('=== Enhanced PII Detection テスト完了 ===');
  });

  test('Patient Summary Generation API Test', async ({ request }) => {
    console.log('=== Patient Summary Generation テスト開始 ===');
    
    const authToken = await getAuthToken();

    const clinicalData = {
      basic_info: {
        age: 42,
        gender: 'female',
        medical_history: '高血圧、糖尿病の既往あり'
      },
      vitals: {
        temperature: 38.2,
        blood_pressure_systolic: 140,
        blood_pressure_diastolic: 90,
        heart_rate: 95,
        respiratory_rate: 20,
        oxygen_saturation: 98
      },
      subjective: '3日前から発熱と咳嗽が続いている。食欲不振あり。倦怠感が強い。',
      objective: '発熱あり。咽頭発赤軽度。肺音清明。心音正常。腹部異常なし。',
      patient_history: [
        {
          date: '2024-01-01',
          diagnosis: '高血圧症',
          treatment: 'ACE阻害薬'
        }
      ]
    };

    const response = await request.post('http://localhost:8000/api/v1/enhanced-clinical/generate-patient-summary', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      data: clinicalData
    });

    expect(response.status()).toBe(200);
    
    const result = await response.json();
    console.log('患者状況整理結果:', JSON.stringify(result.patient_situation, null, 2));

    // アサーション
    expect(result.status).toBe('success');
    expect(result.patient_situation).toHaveProperty('summary');
    expect(result.patient_situation).toHaveProperty('key_findings');
    expect(result.patient_situation).toHaveProperty('differential_diagnoses');
    expect(result.patient_situation).toHaveProperty('risk_factors');
    expect(result.patient_situation).toHaveProperty('recommendations');
    expect(result.patient_situation.confidence_score).toBeGreaterThan(0);

    // 鑑別診断の内容確認
    expect(Array.isArray(result.patient_situation.differential_diagnoses)).toBe(true);
    if (result.patient_situation.differential_diagnoses.length > 0) {
      const firstDiagnosis = result.patient_situation.differential_diagnoses[0];
      expect(firstDiagnosis).toHaveProperty('diagnosis');
      expect(firstDiagnosis).toHaveProperty('probability');
      expect(firstDiagnosis).toHaveProperty('supporting_evidence');
    }

    console.log('✅ 患者状況整理が正常に生成されました');
    console.log(`✅ 信頼度スコア: ${result.patient_situation.confidence_score}`);
    console.log(`✅ 鑑別診断数: ${result.patient_situation.differential_diagnoses.length}`);

    console.log('=== Patient Summary Generation テスト完了 ===');
  });

  test('Clinical Validation API Test', async ({ request }) => {
    console.log('=== Clinical Validation テスト開始 ===');
    
    const authToken = await getAuthToken();

    const validationCases = [
      {
        name: '整合性の高いケース',
        patient_summary: '42歳女性、発熱と咳嗽を主訴とする。バイタルサインで発熱あり、咽頭発赤を認める。上気道炎が疑われる。',
        assessment: '上気道炎の診断。症状と身体所見が一致している。',
        plan: '対症療法として解熱剤処方。水分摂取を促し、3日後に再診。',
        diagnosis_codes: ['J00'],
        expectedConsistency: true
      },
      {
        name: '不整合のあるケース',
        patient_summary: '42歳女性、発熱と咳嗽を主訴とする。バイタルサインで発熱あり、咽頭発赤を認める。上気道炎が疑われる。',
        assessment: '急性心筋梗塞の診断。緊急手術が必要。',
        plan: '心臓カテーテル検査を実施。CCU入室。',
        diagnosis_codes: ['I21.9'],
        expectedConsistency: false
      }
    ];

    for (const testCase of validationCases) {
      console.log(`--- ${testCase.name} ---`);
      
      const response = await request.post('http://localhost:8000/api/v1/enhanced-clinical/validate-clinical-reasoning', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        data: {
          patient_summary: testCase.patient_summary,
          assessment: testCase.assessment,
          plan: testCase.plan,
          diagnosis_codes: testCase.diagnosis_codes
        }
      });

      expect(response.status()).toBe(200);
      
      const result = await response.json();
      console.log(`整合性: ${result.validation_result.is_consistent}`);
      console.log(`整合性スコア: ${result.validation_result.consistency_score}`);
      console.log(`推奨レベル: ${result.recommendation}`);
      console.log(`不整合数: ${result.validation_result.inconsistencies.length}`);

      // アサーション
      expect(result.status).toBe('success');
      expect(result.validation_result).toHaveProperty('is_consistent');
      expect(result.validation_result).toHaveProperty('consistency_score');
      expect(result.validation_result).toHaveProperty('validation_summary');
      expect(Array.isArray(result.validation_result.inconsistencies)).toBe(true);
      expect(Array.isArray(result.validation_result.suggestions)).toBe(true);

      // 期待される整合性の確認
      expect(result.validation_result.is_consistent).toBe(testCase.expectedConsistency);
      
      if (testCase.expectedConsistency) {
        expect(result.validation_result.consistency_score).toBeGreaterThan(0.7);
        console.log('✅ 高い整合性が正しく評価されました');
      } else {
        expect(result.validation_result.consistency_score).toBeLessThan(0.5);
        expect(result.validation_result.inconsistencies.length).toBeGreaterThan(0);
        console.log('✅ 不整合が正しく検知されました');
      }

      console.log('');
    }

    console.log('=== Clinical Validation テスト完了 ===');
  });

  test('Enhanced Clinical Status Test', async ({ request }) => {
    console.log('=== Enhanced Clinical Status テスト開始 ===');
    
    const authToken = await getAuthToken();

    const response = await request.get('http://localhost:8000/api/v1/enhanced-clinical/enhanced-clinical-status', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    
    const status = await response.json();
    console.log('Enhanced Clinical Status:', JSON.stringify(status, null, 2));

    // アサーション
    expect(status.status).toBe('operational');
    expect(status.features).toHaveProperty('patient_summary_generation');
    expect(status.features).toHaveProperty('clinical_validation');
    expect(status.features).toHaveProperty('enhanced_pii_detection');
    expect(status.azure_openai).toHaveProperty('configured');
    expect(Array.isArray(status.masking_levels)).toBe(true);
    expect(Array.isArray(status.supported_pii_types)).toBe(true);

    console.log('✅ Enhanced Clinical Assistant サービスが正常に動作しています');
    console.log(`✅ Azure OpenAI設定: ${status.azure_openai.configured}`);
    console.log(`✅ 対応機能数: ${Object.keys(status.features).length}`);

    console.log('=== Enhanced Clinical Status テスト完了 ===');
  });

  test('Performance and Integration Test', async ({ request }) => {
    console.log('=== Performance and Integration テスト開始 ===');
    
    const authToken = await getAuthToken();

    // 統合ワークフローテスト：PII検知 → 状況整理 → 整合性チェック
    const startTime = Date.now();

    // Step 1: PII検知
    const piiResponse = await request.post('http://localhost:8000/api/v1/enhanced-clinical/enhanced-pii-detection', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        text: '田中太郎さん（38歳男性）の診療記録です。発熱と咳嗽を認めます。',
        medical_context: true,
        masking_level: 'standard'
      }
    });

    expect(piiResponse.status()).toBe(200);
    const piiResult = await piiResponse.json();

    // Step 2: 患者状況整理
    const summaryResponse = await request.post('http://localhost:8000/api/v1/enhanced-clinical/generate-patient-summary', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        basic_info: { age: 38, gender: 'male' },
        vitals: { temperature: 38.0, blood_pressure_systolic: 120, blood_pressure_diastolic: 80 },
        subjective: '発熱と咳嗽があります',
        objective: '咽頭発赤を認めます'
      }
    });

    expect(summaryResponse.status()).toBe(200);
    const summaryResult = await summaryResponse.json();

    // Step 3: 整合性チェック
    const validationResponse = await request.post('http://localhost:8000/api/v1/enhanced-clinical/validate-clinical-reasoning', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        patient_summary: summaryResult.patient_situation.summary,
        assessment: '上気道炎と診断します',
        plan: '対症療法を行います',
        diagnosis_codes: ['J00']
      }
    });

    expect(validationResponse.status()).toBe(200);
    const validationResult = await validationResponse.json();

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`統合ワークフロー完了時間: ${totalTime}ms`);
    console.log(`PII検知結果: ${piiResult.detections.length}件`);
    console.log(`状況整理の信頼度: ${summaryResult.patient_situation.confidence_score}`);
    console.log(`整合性チェック結果: ${validationResult.validation_result.is_consistent}`);

    // パフォーマンス要件チェック（30秒以内）
    expect(totalTime).toBeLessThan(30000);

    console.log('✅ 統合ワークフローが正常に完了しました');
    console.log('✅ パフォーマンス要件を満たしています');

    console.log('=== Performance and Integration テスト完了 ===');
  });
});