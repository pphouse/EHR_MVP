const { test, expect } = require('@playwright/test');

test.describe('処方箋追加ボタンデバッグ', () => {
  test('追加ボタンの状態とクリックイベント確認', async ({ page }) => {
    console.log('🧪 追加ボタンの状態とクリックイベント確認開始');
    
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
    
    // 追加ボタンの状態を詳細確認
    const addButton = page.locator('text=追加').first();
    
    // ボタンが存在するか
    const buttonExists = await addButton.isVisible();
    console.log('📍 追加ボタン表示:', buttonExists);
    
    // ボタンが有効か
    const buttonEnabled = await addButton.isEnabled();
    console.log('📍 追加ボタン有効:', buttonEnabled);
    
    // ボタンのdisabled属性
    const buttonDisabled = await addButton.getAttribute('disabled');
    console.log('📍 追加ボタンdisabled属性:', buttonDisabled);
    
    // ボタンのaria-disabled属性
    const buttonAriaDisabled = await addButton.getAttribute('aria-disabled');
    console.log('📍 追加ボタンaria-disabled属性:', buttonAriaDisabled);
    
    // ボタンのクラス
    const buttonClass = await addButton.getAttribute('class');
    console.log('📍 追加ボタンclass:', buttonClass);
    
    // prescription_itemsの現在の状態をJavaScriptで確認
    const prescriptionItemsState = await page.evaluate(() => {
      // Reactの内部状態にアクセスするのは困難なので、DOMから推測
      const prescriptionSection = document.querySelector('h6');
      if (prescriptionSection && prescriptionSection.textContent.includes('処方薬剤')) {
        const text = prescriptionSection.textContent;
        const match = text.match(/処方薬剤 \((\d+)件\)/);
        return match ? parseInt(match[1]) : 0;
      }
      return -1;
    });
    console.log('📍 現在の処方薬剤件数:', prescriptionItemsState);
    
    // 追加前のスクリーンショット
    await page.screenshot({ path: 'e2e-tests/prescription-button-before-click.png' });
    
    // ボタンをクリック前にJavaScriptでaddMedication関数の存在確認
    const addMedicationExists = await page.evaluate(() => {
      // ページ内でaddMedication関数が定義されているかチェック
      return typeof window.addMedication !== 'undefined';
    });
    console.log('📍 addMedication関数の存在:', addMedicationExists);
    
    // クリックを実行
    console.log('📍 追加ボタンクリック実行中...');
    if (buttonEnabled) {
      await addButton.click();
      console.log('📍 追加ボタンクリック完了');
    } else {
      console.log('⚠️ 追加ボタンが無効のためクリックできません');
    }
    
    // クリック後の待機
    await page.waitForTimeout(3000);
    
    // クリック後の処方薬剤件数を再確認
    const prescriptionItemsStateAfter = await page.evaluate(() => {
      const prescriptionSection = document.querySelector('h6');
      if (prescriptionSection && prescriptionSection.textContent.includes('処方薬剤')) {
        const text = prescriptionSection.textContent;
        const match = text.match(/処方薬剤 \((\d+)件\)/);
        return match ? parseInt(match[1]) : 0;
      }
      return -1;
    });
    console.log('📍 クリック後の処方薬剤件数:', prescriptionItemsStateAfter);
    
    // 追加後のスクリーンショット
    await page.screenshot({ path: 'e2e-tests/prescription-button-after-click.png' });
    
    // 空のメッセージが残っているかチェック
    const emptyMessageVisible = await page.locator('text=処方する薬剤を上記の検索から追加してください').isVisible();
    console.log('📍 空のメッセージ表示:', emptyMessageVisible);
    
    console.log('🎉 追加ボタンの状態とクリックイベント確認完了');
  });
});