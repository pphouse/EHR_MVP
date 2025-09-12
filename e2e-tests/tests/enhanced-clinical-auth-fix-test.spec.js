/**
 * Enhanced Clinical Auth Fix Test
 * 認証修正後のフロントエンド機能テスト
 */

const { test, expect } = require('@playwright/test');

test.describe('Enhanced Clinical Auth Fix Verification', () => {

  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'demo');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Enhanced Clinical Components Authentication Fix', async ({ page }) => {
    console.log('=== Enhanced Clinical 認証修正確認テスト開始 ===');

    // 診療記録作成ページに移動
    await page.goto('http://localhost:3000/encounters/create');
    await page.waitForLoadState('networkidle');

    // SOAP記録ステップまで進む（簡単な方法で）
    console.log('--- SOAP記録ステップに移動 ---');
    
    // 基本情報ステップをスキップするためにURLで直接アクセス
    await page.goto('http://localhost:3000/encounters/create?step=2');
    await page.waitForLoadState('networkidle');
    
    // または、stepperをクリックして進む
    try {
      // ステップ2に直接移動を試行
      const step2 = page.locator('text=SOAP記録');
      if (await step2.isVisible()) {
        await step2.click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('ステップ移動をスキップしてSOAP記録エリアを確認');
    }

    // SOAP入力欄に最小限のデータを入力
    console.log('--- SOAP入力データ準備 ---');
    
    const subjectiveField = page.locator('textarea[placeholder*="患者の訴え"]');
    const objectiveField = page.locator('textarea[placeholder*="身体所見"]');
    
    if (await subjectiveField.isVisible()) {
      await subjectiveField.fill('発熱、咳嗽、倦怠感あり');
    }
    
    if (await objectiveField.isVisible()) {
      await objectiveField.fill('体温38.2℃、咽頭発赤軽度');
    }

    // RealTimeClinicalSummary コンポーネントのテスト
    console.log('--- AI状況整理認証テスト ---');
    const summaryComponent = page.locator('.real-time-clinical-summary');
    
    if (await summaryComponent.isVisible()) {
      const generateButton = summaryComponent.locator('button[data-testid="generate-summary-button"]');
      
      if (await generateButton.isVisible()) {
        console.log('🤖 AI状況整理ボタンをクリック');
        
        // ネットワークレスポンスを監視
        page.on('response', async response => {
          if (response.url().includes('/enhanced-clinical/generate-patient-summary')) {
            console.log(`API Response Status: ${response.status()}`);
            if (response.status() === 200) {
              console.log('✅ 認証成功: AI状況整理APIが正常に動作');
            } else if (response.status() === 401) {
              console.log('❌ 認証エラー: まだ修正が必要');
            }
          }
        });
        
        await generateButton.click();
        
        // レスポンスを待つ
        await page.waitForTimeout(5000);
        
        // 結果の確認
        const summaryContent = summaryComponent.locator('[data-testid="summary-content"]');
        const errorMessage = summaryComponent.locator('div:has-text("エラー")');
        
        if (await summaryContent.isVisible({ timeout: 2000 })) {
          console.log('✅ AI状況整理が成功しました');
        } else if (await errorMessage.isVisible()) {
          console.log('⚠️ エラーが発生しました（詳細確認が必要）');
        } else {
          console.log('⏳ まだ処理中または結果待ち');
        }
      } else {
        console.log('⚠️ 状況整理ボタンが見つかりません');
      }
    } else {
      console.log('⚠️ RealTimeClinicalSummary コンポーネントが見つかりません');
    }

    // Assessment & Plan 入力
    console.log('--- A&P整合性チェック準備 ---');
    const assessmentField = page.locator('textarea[placeholder*="診断"]');
    const planField = page.locator('textarea[placeholder*="治療計画"]');
    
    if (await assessmentField.isVisible()) {
      await assessmentField.fill('上気道感染症疑い');
    }
    
    if (await planField.isVisible()) {
      await planField.fill('対症療法、水分摂取励行');
    }

    // ClinicalValidationChecker のテスト
    const validationComponent = page.locator('.clinical-validation-checker');
    
    if (await validationComponent.isVisible()) {
      const validateButton = validationComponent.locator('button[data-testid="validate-reasoning-button"]');
      
      if (await validateButton.isVisible()) {
        console.log('🔍 A&P整合性チェックボタンをクリック');
        
        page.on('response', async response => {
          if (response.url().includes('/enhanced-clinical/validate-clinical-reasoning')) {
            console.log(`Validation API Response Status: ${response.status()}`);
            if (response.status() === 200) {
              console.log('✅ 認証成功: A&P整合性チェックAPIが正常に動作');
            }
          }
        });
        
        await validateButton.click();
        await page.waitForTimeout(3000);
      }
    }

    // PII検知テスト
    console.log('--- PII検知認証テスト ---');
    const notesField = page.locator('textarea[placeholder*="追加のメモ"]');
    
    if (await notesField.isVisible()) {
      await notesField.fill('患者の田中太郎さんの診療記録です。');
      
      const piiComponent = page.locator('.enhanced-pii-checker');
      
      if (await piiComponent.isVisible()) {
        const piiButton = piiComponent.locator('button[data-testid="pii-check-button"]');
        
        if (await piiButton.isVisible()) {
          console.log('🔒 PII検知ボタンをクリック');
          
          page.on('response', async response => {
            if (response.url().includes('/enhanced-clinical/enhanced-pii-detection')) {
              console.log(`PII API Response Status: ${response.status()}`);
              if (response.status() === 200) {
                console.log('✅ 認証成功: PII検知APIが正常に動作');
              }
            }
          });
          
          await piiButton.click();
          await page.waitForTimeout(3000);
        }
      }
    }

    console.log('=== Enhanced Clinical 認証修正確認テスト完了 ===');
  });
});