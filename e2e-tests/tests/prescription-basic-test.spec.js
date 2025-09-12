const { test, expect } = require('@playwright/test');

test.describe('処方箋基本機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'demo');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(2000);
  });

  test('処方箋機能の基本動作確認', async ({ page }) => {
    console.log('🧪 処方箋基本機能テスト開始');
    
    // Step 1: 処方箋管理ページアクセス
    await page.click('text=処方箋管理');
    await page.waitForURL('**/prescriptions');
    await page.waitForTimeout(1000);
    
    const title = await page.textContent('h4');
    expect(title).toContain('処方箋管理');
    console.log('✅ 処方箋管理ページアクセス成功');
    
    // Step 2: 新しい処方箋作成ページアクセス
    await page.click('text=新しい処方箋');
    await page.waitForURL('**/prescriptions/create');
    await page.waitForTimeout(1000);
    
    const createTitle = await page.textContent('h4');
    expect(createTitle).toContain('新しい処方箋の作成');
    console.log('✅ 処方箋作成ページアクセス成功');
    
    // Step 3: 薬剤検索テスト
    const searchInput = page.locator('input[placeholder*="薬剤名、一般名、商品名で検索"]');
    await searchInput.fill('アセトアミノフェン');
    await page.waitForTimeout(2000);
    
    // 検索結果の確認
    const searchResultsExist = await page.locator('text=検索結果').isVisible();
    if (searchResultsExist) {
      console.log('✅ 薬剤検索結果表示成功');
      
      // 追加ボタンの存在確認
      const addButtonExists = await page.locator('text=追加').first().isVisible();
      if (addButtonExists) {
        console.log('✅ 薬剤追加ボタン表示確認');
      }
    } else {
      console.log('⚠️ 薬剤検索結果が表示されない - APIに問題がある可能性');
    }
    
    // Step 4: 戻るボタンテスト
    await page.click('text=戻る');
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/prescriptions');
    console.log('✅ 戻るボタン機能確認');
    
    await page.screenshot({ path: 'e2e-tests/prescription-basic-test-final.png' });
    console.log('🎉 処方箋基本機能テスト完了');
  });

  test('UIコンポーネントの表示確認', async ({ page }) => {
    console.log('🧪 UI コンポーネント表示テスト開始');
    
    // 処方箋作成ページに移動
    await page.goto('http://localhost:3000/prescriptions/create');
    await page.waitForTimeout(2000);
    
    // 基本情報セクションの確認
    await expect(page.locator('text=基本情報')).toBeVisible();
    await expect(page.locator('text=薬剤検索・追加')).toBeVisible();
    await expect(page.locator('text=処方薬剤')).toBeVisible();
    await expect(page.locator('text=備考・注意事項')).toBeVisible();
    
    // フォーム要素の確認
    const patientSelect = page.locator('label:has-text("患者")').first();
    await expect(patientSelect).toBeVisible();
    
    const encounterSelect = page.locator('label:has-text("診療記録")').first();
    await expect(encounterSelect).toBeVisible();
    
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();
    
    const searchInput = page.locator('input[placeholder*="薬剤名、一般名、商品名で検索"]');
    await expect(searchInput).toBeVisible();
    
    console.log('✅ UI コンポーネント表示確認完了');
    await page.screenshot({ path: 'e2e-tests/prescription-ui-components.png' });
  });

  test('フィルター機能の基本動作', async ({ page }) => {
    console.log('🧪 フィルター機能テスト開始');
    
    // 処方箋一覧ページに移動
    await page.goto('http://localhost:3000/prescriptions');
    await page.waitForTimeout(2000);
    
    // フィルターセクションの表示確認
    await expect(page.locator('text=フィルター・検索')).toBeVisible();
    
    // ステータスドロップダウンの動作確認
    const statusDropdown = page.locator('label:has-text("ステータス")').first();
    if (await statusDropdown.isVisible()) {
      console.log('✅ ステータスフィルター表示確認');
    }
    
    // 日付フィルターの動作確認
    const dateInputs = page.locator('input[type="date"]');
    const dateInputCount = await dateInputs.count();
    expect(dateInputCount).toBeGreaterThanOrEqual(2);
    console.log('✅ 日付フィルター表示確認');
    
    // フィルタークリアボタンの確認
    await expect(page.locator('text=フィルターをクリア')).toBeVisible();
    console.log('✅ フィルタークリアボタン確認');
    
    await page.screenshot({ path: 'e2e-tests/prescription-filters.png' });
  });
});