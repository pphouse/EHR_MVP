/**
 * Encounter Detail Fix Test
 * 診療記録詳細ページの修正確認テスト
 */

const { test, expect } = require('@playwright/test');

test.describe('Encounter Detail Fix Test', () => {

  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'demo');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Encounter Creation and Detail View Fix', async ({ page }) => {
    console.log('=== 診療記録作成→詳細表示 修正確認テスト開始 ===');

    // 診療記録作成ページに移動
    await page.goto('http://localhost:3000/encounters/create');
    await page.waitForLoadState('networkidle');

    console.log('--- 新しい診療記録を作成 ---');
    
    // 基本情報入力
    await page.click('.MuiSelect-select');
    await page.waitForTimeout(500);
    await page.click('li[role="option"]:first-child');
    
    await page.fill('input[type="datetime-local"]', '2025-07-02T15:00');
    await page.fill('input[placeholder="患者の主訴を入力してください"]', 'テスト用診療記録');
    
    // 次のステップへ
    await page.click('button:has-text("次へ")');
    await page.waitForTimeout(1000);

    // バイタルサイン入力
    const tempInput = page.locator('input[type="number"]').first();
    if (await tempInput.isVisible()) {
      await tempInput.fill('36.5');
    }
    
    // SOAP記録ステップへ
    await page.click('button:has-text("次へ")');
    await page.waitForTimeout(1000);

    // SOAP記録入力
    await page.fill('textarea[placeholder*="患者の訴え"]', 'テスト用主観的所見');
    await page.fill('textarea[placeholder*="身体所見"]', 'テスト用客観的所見');
    await page.fill('textarea[placeholder*="診断"]', 'テスト診断');
    await page.fill('textarea[placeholder*="治療計画"]', 'テスト治療計画');

    // 診療記録作成
    console.log('🏥 診療記録を作成中...');
    await page.click('button:has-text("診療記録を作成")');
    
    // 成功メッセージを待つ
    await expect(page.locator('text=診療記録が正常に作成されました')).toBeVisible({ timeout: 10000 });
    console.log('✅ 診療記録が正常に作成されました');

    // 診療記録詳細ページに自動遷移することを確認
    await page.waitForURL('**/encounters/**', { timeout: 10000 });
    console.log('✅ 診療記録詳細ページに遷移しました');

    // 詳細ページのコンテンツが正しく表示されることを確認
    await expect(page.locator('h4')).toBeVisible({ timeout: 5000 });
    
    // エラーメッセージが表示されていないことを確認
    const errorAlert = page.locator('text=データの取得に失敗しました');
    const notFoundAlert = page.locator('text=Encounter not found');
    
    await expect(errorAlert).not.toBeVisible();
    await expect(notFoundAlert).not.toBeVisible();
    console.log('✅ "Encounter not found" エラーが発生していません');

    // 実際のデータが表示されていることを確認
    await expect(page.locator('text=テスト用診療記録')).toBeVisible();
    console.log('✅ 作成した診療記録のデータが正しく表示されています');

    console.log('=== 診療記録作成→詳細表示 修正確認テスト完了 ===');
  });

  test('Existing Encounter Detail View', async ({ page }) => {
    console.log('=== 既存診療記録の詳細表示確認テスト開始 ===');

    // 診療記録一覧ページに移動
    await page.goto('http://localhost:3000/encounters');
    await page.waitForLoadState('networkidle');

    // 最初の診療記録の詳細ボタンをクリック
    const viewButton = page.locator('button[title="詳細表示"]').first();
    if (await viewButton.isVisible()) {
      console.log('👁️ 診療記録詳細ボタンをクリック');
      await viewButton.click();
      
      // 詳細ページに遷移することを確認
      await page.waitForURL('**/encounters/**', { timeout: 10000 });
      console.log('✅ 診療記録詳細ページに遷移しました');

      // エラーメッセージが表示されていないことを確認
      const errorAlert = page.locator('text=データの取得に失敗しました');
      const notFoundAlert = page.locator('text=Encounter not found');
      
      await expect(errorAlert).not.toBeVisible();
      await expect(notFoundAlert).not.toBeVisible();
      console.log('✅ "Encounter not found" エラーが発生していません');

      // コンテンツが表示されていることを確認
      await expect(page.locator('h4')).toBeVisible({ timeout: 5000 });
      console.log('✅ 診療記録の詳細が正しく表示されています');
    } else {
      console.log('⚠️ 診療記録がまだ存在しないか、ボタンが見つかりません');
    }

    console.log('=== 既存診療記録の詳細表示確認テスト完了 ===');
  });

  test('Direct URL Access to Encounter Detail', async ({ page }) => {
    console.log('=== 直接URL指定での診療記録詳細アクセステスト開始 ===');

    // 存在する診療記録IDで直接アクセス（ID=1を試す）
    await page.goto('http://localhost:3000/encounters/1');
    await page.waitForLoadState('networkidle');

    // エラーメッセージが表示されていないことを確認
    const errorAlert = page.locator('text=データの取得に失敗しました');
    const notFoundAlert = page.locator('text=Encounter not found');
    
    await expect(errorAlert).not.toBeVisible();
    await expect(notFoundAlert).not.toBeVisible();
    console.log('✅ 直接URLアクセスで "Encounter not found" エラーが発生していません');

    // コンテンツが表示されていることを確認
    await expect(page.locator('h4')).toBeVisible({ timeout: 5000 });
    console.log('✅ 診療記録の詳細が正しく表示されています');

    console.log('=== 直接URL指定での診療記録詳細アクセステスト完了 ===');
  });
});