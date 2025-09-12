const { test, expect } = require('@playwright/test');

test.describe('処方箋単位フィールドデバッグ', () => {
  test('処方箋作成ページの現在の状態確認', async ({ page }) => {
    console.log('🧪 処方箋作成ページ現在状態確認開始');
    
    // ログイン
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'demo');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(2000);
    
    // 処方箋作成ページに移動
    await page.goto('http://localhost:3000/prescriptions/create');
    await page.waitForTimeout(3000);
    
    console.log('📍 現在のページURL:', page.url());
    
    // ページのタイトル確認
    const title = await page.textContent('h4');
    console.log('📍 ページタイトル:', title);
    
    // 薬剤検索と追加
    const searchInput = page.locator('input[placeholder*="薬剤名、一般名、商品名で検索"]');
    await searchInput.fill('アセトアミノフェン');
    await page.waitForTimeout(2000);
    
    // 検索結果を確認
    const searchResultsVisible = await page.locator('text=検索結果').isVisible();
    console.log('📍 検索結果表示:', searchResultsVisible);
    
    if (searchResultsVisible) {
      // 薬剤を追加
      const addButton = page.locator('text=追加').first();
      await addButton.click();
      await page.waitForTimeout(2000);
      
      // テーブルヘッダーを全て取得
      const tableHeaders = await page.locator('table th').allTextContents();
      console.log('📍 テーブルヘッダー:', tableHeaders);
      
      // 処方薬剤テーブルが存在するかチェック
      const prescriptionTableExists = await page.locator('text=処方薬剤').isVisible();
      console.log('📍 処方薬剤テーブル存在:', prescriptionTableExists);
      
      // テーブル行の数を確認
      const tableRows = await page.locator('table tbody tr').count();
      console.log('📍 テーブル行数:', tableRows);
      
      if (tableRows > 0) {
        // 最初の行の全セル内容を取得
        const firstRowCells = await page.locator('table tbody tr').first().locator('td').allTextContents();
        console.log('📍 最初の行のセル内容:', firstRowCells);
        
        // 入力フィールドを確認
        const inputFields = await page.locator('table tbody tr').first().locator('input').count();
        console.log('📍 最初の行の入力フィールド数:', inputFields);
        
        // プレースホルダーを確認
        const placeholders = [];
        for (let i = 0; i < inputFields; i++) {
          const placeholder = await page.locator('table tbody tr').first().locator('input').nth(i).getAttribute('placeholder');
          placeholders.push(placeholder);
        }
        console.log('📍 入力フィールドのプレースホルダー:', placeholders);
      }
    }
    
    await page.screenshot({ path: 'e2e-tests/prescription-unit-debug.png' });
    console.log('📍 デバッグスクリーンショット保存完了');
    
    console.log('🎉 処方箋作成ページ現在状態確認完了');
  });
});