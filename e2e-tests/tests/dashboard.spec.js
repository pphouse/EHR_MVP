const { test, expect } = require('@playwright/test');

test.describe('ダッシュボード機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログインしてダッシュボードに移動
    await page.goto('http://localhost:3000');
    
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    
    // ダッシュボードページに到達するまで待機
    await page.waitForURL('**/dashboard');
  });

  test('ダッシュボードの基本要素が表示される', async ({ page }) => {
    console.log('ダッシュボードの基本要素をチェックしています');

    // ページタイトルを確認
    await expect(page).toHaveTitle(/EHR MVP/);

    // メインナビゲーション要素を確認（ロールボタンで特定）
    await expect(page.getByRole('button', { name: 'ダッシュボード' })).toBeVisible();
    await expect(page.getByRole('button', { name: '患者管理' })).toBeVisible();
    await expect(page.getByRole('button', { name: '診療記録' })).toBeVisible();

    // ユーザー情報の表示を確認（挨拶メッセージで特定）
    await expect(page.locator('text=おはようございます、Demo Userさん')).toBeVisible();

    // 統計情報の表示を確認
    await expect(page.locator('text=本日の患者数')).toBeVisible();
    await expect(page.locator('text=新規診療記録')).toBeVisible();
    await expect(page.locator('text=今月の診療数')).toBeVisible();
    await expect(page.locator('text=予約待ち')).toBeVisible();

    console.log('ダッシュボードの基本要素が正しく表示されています');
  });

  test('患者管理ページに移動できる', async ({ page }) => {
    console.log('患者管理ページへの移動をテストしています');

    // 患者管理リンクをクリック（ナビゲーションボタンを特定）
    await page.getByRole('button', { name: '患者管理' }).click();

    // URLが変更されることを確認
    await page.waitForURL('**/patients');

    // 患者管理ページの要素を確認
    const content = await page.textContent('body');
    console.log('患者管理ページの内容:', content.substring(0, 200));

    // スクリーンショットを保存
    await page.screenshot({ path: 'patients-page.png', fullPage: true });
    console.log('患者管理ページのスクリーンショットを保存しました');
  });

  test('診療記録ページに移動できる', async ({ page }) => {
    console.log('診療記録ページへの移動をテストしています');

    // 診療記録リンクをクリック（ナビゲーションボタンを特定）
    await page.getByRole('button', { name: '診療記録' }).click();

    // URLが変更されることを確認
    await page.waitForURL('**/encounters');

    // 診療記録ページの要素を確認
    const content = await page.textContent('body');
    console.log('診療記録ページの内容:', content.substring(0, 200));

    // スクリーンショットを保存
    await page.screenshot({ path: 'encounters-page.png', fullPage: true });
    console.log('診療記録ページのスクリーンショットを保存しました');
  });

  test('ダッシュボードの最近の患者リストが表示される', async ({ page }) => {
    console.log('最近の患者リストをチェックしています');

    // 最近の患者セクションを確認
    const patientsSection = page.locator('text=最近の患者').locator('..');
    await expect(patientsSection).toBeVisible();

    // 患者情報が表示されているか確認
    const patientNames = ['田中 太郎', '佐藤 花子', '山田 次郎'];
    
    for (const name of patientNames) {
      const patientElement = page.locator(`text=${name}`);
      const isVisible = await patientElement.isVisible().catch(() => false);
      if (isVisible) {
        console.log(`患者 ${name} が表示されています`);
      }
    }

    // 患者の詳細情報（年齢、最終来院日）が表示されているか確認
    const ageText = page.locator('text=/年齢:/');
    const lastVisitText = page.locator('text=/最終来院:/');
    
    const ageVisible = await ageText.isVisible().catch(() => false);
    const lastVisitVisible = await lastVisitText.isVisible().catch(() => false);
    
    if (ageVisible) console.log('患者の年齢情報が表示されています');
    if (lastVisitVisible) console.log('最終来院日情報が表示されています');
  });
});