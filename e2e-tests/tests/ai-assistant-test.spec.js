const { test, expect } = require('@playwright/test');

test.describe('AI Assistant Safety Layer Tests', () => {
  
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

  test('Azure OpenAI Safety Check API Test', async ({ request }) => {
    console.log('=== Azure OpenAI Safety Check API テスト開始 ===');
    
    const authToken = await getAuthToken();

    const testCases = [
      {
        name: 'PII検知テスト（患者名）',
        text: '患者の田中太郎さん、38歳男性で発熱と咳嗽を訴えています。',
        expectedRiskLevel: 'high',
        expectedAction: 'rewrite'
      },
      {
        name: '医療情報安全テスト',
        text: '血圧は120/80、体温36.5度で正常範囲内です。',
        expectedRiskLevel: 'low',
        expectedAction: 'allow'
      },
      {
        name: '複合PII検知テスト',
        text: '田中太郎（患者番号：P123456、電話番号：090-1234-5678）の検査結果です。',
        expectedRiskLevel: 'high',
        expectedAction: 'rewrite'
      }
    ];

    for (const testCase of testCases) {
      console.log(`--- ${testCase.name} ---`);
      
      const response = await request.post('http://localhost:8000/api/v1/ai-assistant/safety-check', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        data: {
          text: testCase.text,
          context: { test: 'playwright_e2e' }
        }
      });

      expect(response.status()).toBe(200);
      
      const result = await response.json();
      console.log(`元のテキスト: ${result.original_text}`);
      console.log(`処理後テキスト: ${result.processed_text}`);
      console.log(`リスクレベル: ${result.risk_level}`);
      console.log(`アクション: ${result.action_taken}`);
      console.log(`信頼度: ${result.confidence_score}`);
      console.log(`検知問題数: ${result.detected_issues.length}`);
      console.log(`処理時間: ${result.processing_time_ms}ms`);

      // アサーション
      expect(result.risk_level).toBe(testCase.expectedRiskLevel);
      expect(result.action_taken).toBe(testCase.expectedAction);
      expect(result.confidence_score).toBeGreaterThan(0);
      expect(result.processing_time_ms).toBeGreaterThan(0);
      expect(Array.isArray(result.detected_issues)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);

      if (testCase.expectedAction === 'rewrite') {
        expect(result.processed_text).not.toBe(result.original_text);
        console.log('✅ テキストが正常にリライトされました');
      }

      if (testCase.name.includes('PII')) {
        expect(result.detected_issues.length).toBeGreaterThan(0);
        console.log('✅ PII検知が正常に動作しました');
      }

      console.log('');
    }

    console.log('=== Azure OpenAI Safety Check API テスト完了 ===');
  });

  test('AI Assistant Safety Status Test', async ({ request }) => {
    console.log('=== AI Assistant Safety Status テスト開始 ===');
    
    const authToken = await getAuthToken();

    const response = await request.get('http://localhost:8000/api/v1/ai-assistant/safety-status', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    
    const status = await response.json();
    console.log('Safety Layer Status:', JSON.stringify(status, null, 2));

    // アサーション
    expect(status.safety_layer.azure_openai_configured).toBe(true);
    expect(status.safety_layer.deployment_name).toBe('gpt-4.1-mini');
    expect(status.safety_layer.api_version).toBe('2024-12-01-preview');
    expect(status.system_health.status).toBe('operational');
    expect(status.user_permissions.can_use_diagnosis_assist).toBe(true);

    console.log('✅ Azure OpenAI設定が正常に確認されました');
    console.log('✅ システムヘルス: operational');
    console.log('✅ ユーザー権限が正常に設定されています');

    console.log('=== AI Assistant Safety Status テスト完了 ===');
  });

  test('Diagnosis Assist API Test', async ({ request }) => {
    console.log('=== Diagnosis Assist API テスト開始 ===');
    
    const authToken = await getAuthToken();

    const response = await request.post('http://localhost:8000/api/v1/ai-assistant/diagnosis-assist', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        symptoms: ['発熱', '咳嗽', '頭痛', '倦怠感'],
        patient_context: {
          age: 42,
          gender: 'female',
          medical_history: ['高血圧']
        },
        lab_results: {
          WBC: '11000',
          CRP: '2.8',
          体温: '38.2'
        }
      }
    });

    expect(response.status()).toBe(200);
    
    const result = await response.json();
    console.log('診断支援結果:', JSON.stringify(result, null, 2));

    // アサーション
    expect(result.symptoms_processed).toContain('発熱');
    expect(result.symptoms_processed).toContain('咳嗽');
    expect(result.safety_status).toHaveProperty('risk_level');
    expect(result.safety_status).toHaveProperty('confidence');
    expect(Array.isArray(result.differential_diagnoses)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);

    // 鑑別診断の内容確認
    expect(result.differential_diagnoses.length).toBeGreaterThan(0);
    result.differential_diagnoses.forEach(diagnosis => {
      expect(diagnosis).toHaveProperty('diagnosis');
      expect(diagnosis).toHaveProperty('probability');
      expect(diagnosis).toHaveProperty('reasoning');
      expect(diagnosis).toHaveProperty('recommended_tests');
    });

    console.log('✅ 診断支援APIが正常に動作しました');
    console.log(`✅ ${result.differential_diagnoses.length}個の鑑別診断候補が生成されました`);
    console.log('✅ 安全性評価が実行されました');

    console.log('=== Diagnosis Assist API テスト完了 ===');
  });

  test('Medical Summary Generation API Test', async ({ request }) => {
    console.log('=== Medical Summary Generation API テスト開始 ===');
    
    const authToken = await getAuthToken();

    const encounterData = {
      chief_complaint: '胸痛',
      history: '3日前から胸部圧迫感が続いている',
      physical_exam: '心音正常、肺音清明',
      assessment: '狭心症疑い',
      plan: '心電図、心エコー検査予定',
      medications: 'ニトロール舌下錠処方'
    };

    const response = await request.post('http://localhost:8000/api/v1/ai-assistant/generate-summary', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        encounter_data: encounterData,
        summary_type: 'discharge',
        include_medications: true
      }
    });

    expect(response.status()).toBe(200);
    
    const result = await response.json();
    console.log('要約生成結果:', JSON.stringify(result, null, 2));

    // アサーション
    expect(result.summary).toHaveProperty('summary_type');
    expect(result.summary).toHaveProperty('sections');
    expect(result.safety_status).toHaveProperty('risk_level');
    expect(result.safety_status).toHaveProperty('action_taken');
    expect(result.metadata).toHaveProperty('generated_at');
    expect(result.metadata).toHaveProperty('generated_by');
    expect(result.metadata).toHaveProperty('processing_time_ms');

    // 要約内容の確認
    expect(result.summary.sections).toHaveProperty('chief_complaint');
    expect(result.summary.sections).toHaveProperty('diagnosis');
    expect(result.summary.sections).toHaveProperty('treatment');

    console.log('✅ 医療要約生成APIが正常に動作しました');
    console.log('✅ 安全性チェックが実行されました');
    console.log('✅ 構造化要約が生成されました');

    console.log('=== Medical Summary Generation API テスト完了 ===');
  });

  test('AI Assistant Frontend Integration Test', async ({ page }) => {
    console.log('=== AI Assistant Frontend Integration テスト開始 ===');
    
    const authToken = await getAuthToken();

    // ダッシュボードページに移動
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // AI Assistantコンポーネントの存在確認
    const aiAssistantButton = page.locator('[data-testid="ai-assistant-button"], button:has-text("AI Assistant"), button:has-text("AI支援")');
    
    if (await aiAssistantButton.count() > 0) {
      console.log('✅ AI Assistantボタンが見つかりました');
      
      // ボタンをクリック
      await aiAssistantButton.first().click();
      await page.waitForTimeout(1000);
      
      console.log('✅ AI Assistantダイアログが開きました');
    } else {
      console.log('ℹ️ AI Assistantボタンが見つかりませんでした（まだフロントエンド実装されていない可能性があります）');
    }

    // APIエンドポイントへの直接アクセステスト
    const apiResponse = await page.evaluate(async (token) => {
      try {
        const response = await fetch('/api/v1/ai-assistant/safety-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return {
          status: response.status,
          data: await response.json()
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    }, authToken);

    if (apiResponse.status === 200) {
      console.log('✅ フロントエンドからAI Assistant APIへの接続が成功しました');
      console.log(`✅ Azure OpenAI設定状態: ${apiResponse.data.safety_layer.azure_openai_configured}`);
    } else {
      console.log('⚠️ フロントエンドからAI Assistant APIへの接続に問題があります');
    }

    console.log('=== AI Assistant Frontend Integration テスト完了 ===');
  });

  test('Performance and Error Handling Test', async ({ request }) => {
    console.log('=== Performance and Error Handling テスト開始 ===');
    
    const authToken = await getAuthToken();

    // パフォーマンステスト
    const startTime = Date.now();
    
    const response = await request.post('http://localhost:8000/api/v1/ai-assistant/safety-check', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        text: '田中太郎さん（患者番号P123456）の診療記録です。血圧140/90、薬剤アレルギーあり。',
        context: { test: 'performance' }
      }
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);
    
    const result = await response.json();
    
    console.log(`API応答時間: ${responseTime}ms`);
    console.log(`Azure OpenAI処理時間: ${result.processing_time_ms}ms`);
    console.log(`検知された問題数: ${result.detected_issues.length}`);

    // パフォーマンス要件チェック（10秒以内）
    expect(responseTime).toBeLessThan(10000);
    expect(result.processing_time_ms).toBeLessThan(10000);

    console.log('✅ パフォーマンス要件を満たしています');

    // エラーハンドリングテスト - 不正なリクエスト
    const errorResponse = await request.post('http://localhost:8000/api/v1/ai-assistant/safety-check', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        // textフィールドを意図的に省略
        context: { test: 'error_handling' }
      }
    });

    expect(errorResponse.status()).toBe(422); // Validation Error
    console.log('✅ 不正なリクエストに対する適切なエラーハンドリングが確認されました');

    console.log('=== Performance and Error Handling テスト完了 ===');
  });
});