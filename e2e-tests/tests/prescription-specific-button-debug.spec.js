const { test, expect } = require('@playwright/test');

test.describe('処方箋正確なボタンデバッグ', () => {
  test('正確な追加ボタンを特定してクリック', async ({ page }) => {
    console.log('🧪 正確な追加ボタンを特定してクリック開始');
    
    // コンソールメッセージをキャプチャ
    page.on('console', msg => {
      console.log(`📍 ブラウザコンソール [${msg.type()}]:`, msg.text());
    });
    
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
    
    // 薬剤検索
    const searchInput = page.locator('input[placeholder*="薬剤名、一般名、商品名で検索"]');
    await searchInput.fill('アセトアミノフェン');
    await page.waitForTimeout(2000);
    
    // 全ての"追加"テキストを持つ要素を確認
    const allAddElements = await page.locator('text=追加').count();
    console.log('📍 "追加"テキストを持つ要素数:', allAddElements);
    
    for (let i = 0; i < allAddElements; i++) {
      const element = page.locator('text=追加').nth(i);
      const tagName = await element.evaluate(el => el.tagName);
      const classList = await element.getAttribute('class');
      const textContent = await element.textContent();
      console.log(`📍 要素${i}: タグ=${tagName}, クラス=${classList}, テキスト="${textContent}"`);
    }
    
    // テーブル内のボタンを特定 - より具体的なセレクタを使用
    const tableButton = page.locator('table tbody button:has-text("追加")');
    const tableButtonCount = await tableButton.count();
    console.log('📍 テーブル内の追加ボタン数:', tableButtonCount);
    
    if (tableButtonCount > 0) {
      const buttonExists = await tableButton.first().isVisible();
      const buttonEnabled = await tableButton.first().isEnabled();
      const buttonText = await tableButton.first().textContent();
      console.log('📍 テーブル内追加ボタン表示:', buttonExists);
      console.log('📍 テーブル内追加ボタン有効:', buttonEnabled);
      console.log('📍 テーブル内追加ボタンテキスト:', buttonText);
      
      // 追加前のスクリーンショット
      await page.screenshot({ path: 'e2e-tests/prescription-specific-before.png' });
      
      // 正確なボタンをクリック
      console.log('📍 テーブル内追加ボタンクリック実行中...');
      await tableButton.first().click();
      console.log('📍 テーブル内追加ボタンクリック完了');
      
      // クリック後の待機
      await page.waitForTimeout(3000);
      
      // 追加後のスクリーンショット
      await page.screenshot({ path: 'e2e-tests/prescription-specific-after.png' });
      
      // 処方薬剤件数を確認
      const prescriptionSection = await page.locator('text=処方薬剤').textContent();
      console.log('📍 処方薬剤セクション:', prescriptionSection);
      
      // 空のメッセージが消えたかチェック
      const emptyMessageVisible = await page.locator('text=処方する薬剤を上記の検索から追加してください').isVisible();
      console.log('📍 空のメッセージ表示:', emptyMessageVisible);
    } else {
      console.log('⚠️ テーブル内に追加ボタンが見つかりません');
    }
    
    console.log('🎉 正確な追加ボタンを特定してクリック完了');
  });
});