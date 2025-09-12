const { test, expect } = require('@playwright/test');

test.describe('処方箋追加後テーブルデバッグ', () => {
  test('薬剤追加後の処方薬剤テーブル確認', async ({ page }) => {
    console.log('🧪 薬剤追加後の処方薬剤テーブル確認開始');
    
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
    
    // 薬剤検索と追加
    const searchInput = page.locator('input[placeholder*="薬剤名、一般名、商品名で検索"]');
    await searchInput.fill('アセトアミノフェン');
    await page.waitForTimeout(2000);
    
    console.log('📍 薬剤検索完了');
    
    // 薬剤を追加
    const addButton = page.locator('text=追加').first();
    await addButton.click();
    await page.waitForTimeout(2000);
    
    console.log('📍 薬剤追加完了');
    
    // ページ内の全てのテーブルを確認
    const allTables = await page.locator('table').count();
    console.log('📍 ページ内のテーブル数:', allTables);
    
    // 最後のテーブル（処方薬剤テーブル）のヘッダーを確認
    if (allTables >= 2) {
      const lastTableHeaders = await page.locator('table').last().locator('th').allTextContents();
      console.log('📍 最後のテーブル（処方薬剤テーブル）のヘッダー:', lastTableHeaders);
      
      // 最後のテーブルの行数を確認
      const lastTableRows = await page.locator('table').last().locator('tbody tr').count();
      console.log('📍 最後のテーブルの行数:', lastTableRows);
      
      if (lastTableRows > 0) {
        // 最後のテーブルの最初の行のセル内容
        const lastTableFirstRowCells = await page.locator('table').last().locator('tbody tr').first().locator('td').allTextContents();
        console.log('📍 最後のテーブルの最初の行のセル内容:', lastTableFirstRowCells);
        
        // 最後のテーブルの入力フィールド数
        const lastTableInputs = await page.locator('table').last().locator('tbody tr').first().locator('input').count();
        console.log('📍 最後のテーブルの入力フィールド数:', lastTableInputs);
        
        // 各入力フィールドのプレースホルダー
        for (let i = 0; i < lastTableInputs; i++) {
          const input = page.locator('table').last().locator('tbody tr').first().locator('input').nth(i);
          const placeholder = await input.getAttribute('placeholder');
          const value = await input.inputValue();
          console.log(`📍 入力フィールド${i}: placeholder="${placeholder}", value="${value}"`);
        }
      }
    }
    
    // 処方薬剤セクションのテキストを確認
    const prescriptionSectionVisible = await page.locator('text=処方薬剤').isVisible();
    console.log('📍 処方薬剤セクション表示:', prescriptionSectionVisible);
    
    // 「処方する薬剤を上記の検索から追加してください」メッセージの確認
    const emptyMessageVisible = await page.locator('text=処方する薬剤を上記の検索から追加してください').isVisible();
    console.log('📍 空のメッセージ表示:', emptyMessageVisible);
    
    await page.screenshot({ path: 'e2e-tests/prescription-added-table-debug.png' });
    
    console.log('🎉 薬剤追加後の処方薬剤テーブル確認完了');
  });
});