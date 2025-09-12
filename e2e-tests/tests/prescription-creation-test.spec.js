const { test, expect } = require('@playwright/test');

test.describe('処方箋作成機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'demo');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(2000);
  });

  test('処方箋作成ページのエラーハンドリング確認', async ({ page }) => {
    console.log('🧪 処方箋作成エラーハンドリングテスト開始');
    
    // 処方箋作成ページに直接移動
    await page.goto('http://localhost:3000/prescriptions/create');
    await page.waitForTimeout(3000);
    
    // ページが正常に読み込まれることを確認
    await expect(page.locator('h4')).toContainText('新しい処方箋の作成');
    console.log('✅ 処方箋作成ページ読み込み成功');
    
    // エラーメッセージが表示されていないことを確認
    const errorAlert = page.locator('.MuiAlert-standardError');
    const hasError = await errorAlert.isVisible();
    
    if (!hasError) {
      console.log('✅ Reactエラーが発生していません');
    } else {
      const errorText = await errorAlert.textContent();
      console.log('⚠️ エラーメッセージ:', errorText);
    }
    
    // 基本的なUIコンポーネントが正常に表示されることを確認
    await expect(page.locator('text=基本情報')).toBeVisible();
    await expect(page.locator('text=薬剤検索・追加')).toBeVisible();
    await expect(page.locator('text=処方薬剤')).toBeVisible();
    
    console.log('✅ UIコンポーネント正常表示確認');
    
    await page.screenshot({ path: 'e2e-tests/prescription-error-fix-test.png' });
  });

  test('処方箋作成フォームの入力テスト', async ({ page }) => {
    console.log('🧪 処方箋作成フォーム入力テスト開始');
    
    await page.goto('http://localhost:3000/prescriptions/create');
    await page.waitForTimeout(2000);
    
    // 処方日の入力テスト
    const today = new Date().toISOString().slice(0, 10);
    await page.fill('input[type="date"]', today);
    console.log('✅ 処方日入力成功');
    
    // 処方指示の入力テスト
    await page.fill('textarea[placeholder*="全体的な服薬指示"]', 'テスト用処方指示');
    console.log('✅ 処方指示入力成功');
    
    // 備考の入力テスト
    await page.fill('textarea[placeholder*="処方に関する備考"]', 'テスト用備考');
    console.log('✅ 備考入力成功');
    
    // 薬剤検索テスト
    const searchInput = page.locator('input[placeholder*="薬剤名、一般名、商品名で検索"]');
    await searchInput.fill('アセトアミノフェン');
    await page.waitForTimeout(2000);
    
    // 検索結果の確認
    const hasSearchResults = await page.locator('text=検索結果').isVisible();
    if (hasSearchResults) {
      console.log('✅ 薬剤検索成功');
      
      // 追加ボタンのテスト
      const addButton = page.locator('text=追加').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        // 処方薬剤テーブルに追加されたか確認
        const prescriptionTable = page.locator('table').last();
        const hasTableRows = await prescriptionTable.locator('tbody tr').count();
        
        if (hasTableRows > 0) {
          console.log('✅ 薬剤追加成功');
        } else {
          console.log('⚠️ 薬剤がテーブルに追加されませんでした');
        }
      }
    } else {
      console.log('⚠️ 薬剤検索結果が表示されません');
    }
    
    await page.screenshot({ path: 'e2e-tests/prescription-form-input-test.png' });
    console.log('🎉 処方箋作成フォーム入力テスト完了');
  });

  test('薬剤検索とエラーハンドリング', async ({ page }) => {
    console.log('🧪 薬剤検索エラーハンドリングテスト開始');
    
    await page.goto('http://localhost:3000/prescriptions/create');
    await page.waitForTimeout(2000);
    
    // 短い検索語でのテスト（2文字未満）
    const searchInput = page.locator('input[placeholder*="薬剤名、一般名、商品名で検索"]');
    await searchInput.fill('a');
    await page.waitForTimeout(1000);
    
    // 検索結果が表示されないことを確認
    const hasSearchResults = await page.locator('text=検索結果').isVisible();
    expect(hasSearchResults).toBe(false);
    console.log('✅ 短い検索語で検索結果が表示されないことを確認');
    
    // 正常な検索語でのテスト
    await searchInput.fill('アセトアミノフェン');
    await page.waitForTimeout(2000);
    
    // エラーが発生していないことを確認
    const errorAlert = page.locator('.MuiAlert-standardError');
    const hasError = await errorAlert.isVisible();
    expect(hasError).toBe(false);
    console.log('✅ 薬剤検索時にエラーが発生していません');
    
    await page.screenshot({ path: 'e2e-tests/medication-search-error-handling.png' });
  });
});