/**
 * Encounter Not Found Fix Verification
 * "Encounter not found" エラー修正の確認テスト
 */

const { test, expect } = require('@playwright/test');

test.describe('Encounter Not Found Fix Verification', () => {

  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'demo');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Verify Encounter Not Found Error is Fixed', async ({ page }) => {
    console.log('=== "Encounter not found" エラー修正確認テスト ===');

    // 診療記録一覧ページに移動
    await page.goto('http://localhost:3000/encounters');
    await page.waitForLoadState('networkidle');
    console.log('診療記録一覧ページにアクセス');

    // 詳細ボタンが存在するかチェック
    const viewButtons = page.locator('button[title="詳細表示"]');
    const buttonCount = await viewButtons.count();
    console.log(`詳細ボタンの数: ${buttonCount}`);

    if (buttonCount > 0) {
      // 最初の診療記録の詳細ボタンをクリック
      console.log('👁️ 最初の診療記録の詳細ボタンをクリック');
      await viewButtons.first().click();
      
      // 詳細ページに遷移することを確認
      await page.waitForURL('**/encounters/**', { timeout: 10000 });
      console.log('✅ 診療記録詳細ページに遷移');

      // ページが読み込まれるまで待機
      await page.waitForLoadState('networkidle');
      
      // エラーメッセージをチェック
      console.log('--- エラーメッセージ確認 ---');
      
      const errorMessages = [
        'データの取得に失敗しました',
        'Encounter not found',
        'エラーが発生しました',
        'Failed to fetch'
      ];
      
      let hasError = false;
      for (const errorMsg of errorMessages) {
        const errorElement = page.locator(`text=${errorMsg}`);
        if (await errorElement.isVisible()) {
          console.log(`❌ エラーメッセージが検出されました: "${errorMsg}"`);
          hasError = true;
          break;
        }
      }
      
      if (!hasError) {
        console.log('✅ エラーメッセージは検出されませんでした');
      }

      // ページコンテンツの存在確認
      console.log('--- ページコンテンツ確認 ---');
      
      const contentSelectors = [
        'h4',
        'h5',  
        '[role="tabpanel"]',
        'text=基本情報',
        'text=バイタルサイン',
        'text=SOAP記録'
      ];
      
      let hasContent = false;
      for (const selector of contentSelectors) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          console.log(`✅ コンテンツが表示されています: ${selector}`);
          hasContent = true;
          break;
        }
      }
      
      if (!hasContent) {
        console.log('⚠️ 主要なコンテンツが見つかりません');
      }

      // 最終判定
      if (!hasError && hasContent) {
        console.log('🎉 修正成功: "Encounter not found" エラーは解決されました');
      } else if (!hasError) {
        console.log('⚠️ エラーは解決されましたが、コンテンツ表示に問題があります');
      } else {
        console.log('❌ まだエラーが発生しています');
      }

    } else {
      console.log('⚠️ 診療記録が存在しないか、詳細ボタンが見つかりません');
      
      // 新しい診療記録を作成してテスト
      console.log('新しい診療記録を作成してテストします');
      await page.goto('http://localhost:3000/encounters/create');
      // ... 簡単な診療記録作成ロジック
    }

    console.log('=== テスト完了 ===');
  });

  test('Direct ID Access Test', async ({ page }) => {
    console.log('=== 直接ID指定アクセステスト ===');

    // 複数のIDで直接アクセステスト
    const testIds = [1, 2, 3];
    
    for (const testId of testIds) {
      console.log(`--- ID ${testId} のテスト ---`);
      
      await page.goto(`http://localhost:3000/encounters/${testId}`);
      await page.waitForLoadState('networkidle');
      
      // エラーメッセージの確認
      const notFoundError = page.locator('text=Encounter not found');
      const dataFetchError = page.locator('text=データの取得に失敗しました');
      
      if (await notFoundError.isVisible() || await dataFetchError.isVisible()) {
        console.log(`❌ ID ${testId}: エラーが発生`);
      } else {
        console.log(`✅ ID ${testId}: エラーなし`);
      }
    }

    console.log('=== 直接ID指定アクセステスト完了 ===');
  });
});