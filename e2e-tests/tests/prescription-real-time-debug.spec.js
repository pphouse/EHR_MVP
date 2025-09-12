const { test, expect } = require('@playwright/test');

test.describe('処方箋リアルタイムデバッグ', () => {
  test('リアルタイム薬剤追加状態確認', async ({ page }) => {
    console.log('🧪 リアルタイム薬剤追加状態確認開始');
    
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
    
    // JavaScript でログを追加
    await page.evaluate(() => {
      console.log('📍 ページロード完了');
      console.log('📍 現在のprescription_items:', window.prescriptionData?.prescription_items);
    });
    
    // 薬剤検索
    const searchInput = page.locator('input[placeholder*="薬剤名、一般名、商品名で検索"]');
    await searchInput.fill('アセトアミノフェン');
    await page.waitForTimeout(2000);
    console.log('📍 薬剤検索完了');
    
    // 検索結果の確認
    const searchResultsVisible = await page.locator('text=検索結果').isVisible();
    console.log('📍 検索結果表示:', searchResultsVisible);
    
    // 追加前のprescription_items状態を確認
    const beforeAddState = await page.evaluate(() => {
      // prescription_itemsの現在の状態をReactの状態から取得
      const reactFiberKey = Object.keys(document.querySelector('#root')).find(key => key.startsWith('__reactFiber'));
      if (reactFiberKey) {
        const fiber = document.querySelector('#root')[reactFiberKey];
        // Reactコンポーネント内のstateを探す（これは実際の実装では複雑）
        return { message: 'React state access attempted' };
      }
      return { message: 'React state not accessible' };
    });
    console.log('📍 追加前の状態:', beforeAddState);
    
    // スクリーンショット（追加前）
    await page.screenshot({ path: 'e2e-tests/prescription-before-add.png' });
    
    // 薬剤を追加
    const addButton = page.locator('text=追加').first();
    console.log('📍 追加ボタンクリック実行');
    await addButton.click();
    
    // 少し待機してスクリーンショット（追加後）
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e-tests/prescription-after-add.png' });
    
    // 追加後の状態確認
    await page.evaluate(() => {
      console.log('📍 追加ボタンクリック後');
    });
    
    // 処方薬剤件数を確認
    const prescriptionCountText = await page.locator('text=処方薬剤').textContent();
    console.log('📍 処方薬剤カウント表示:', prescriptionCountText);
    
    // 空のメッセージが消えたかチェック
    const emptyMessageVisible = await page.locator('text=処方する薬剤を上記の検索から追加してください').isVisible();
    console.log('📍 空のメッセージ表示:', emptyMessageVisible);
    
    // テーブルが表示されたかチェック
    const tableVisible = await page.locator('table').last().isVisible();
    console.log('📍 処方薬剤テーブル表示:', tableVisible);
    
    console.log('🎉 リアルタイム薬剤追加状態確認完了');
  });
});