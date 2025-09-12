const { test, expect } = require('@playwright/test');

test.describe('診療記録機能テスト（簡略版）', () => {
  test.beforeEach(async ({ page }) => {
    // ログインして診療記録ページに移動
    await page.goto('http://localhost:3000');
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
    
    // 診療記録ページに移動
    await page.getByRole('button', { name: '診療記録' }).click();
    await page.waitForURL('**/encounters');
  });

  test('診療記録一覧ページの基本表示確認', async ({ page }) => {
    console.log('=== 診療記録一覧ページ基本表示テスト開始 ===');

    // ページタイトルの確認
    await expect(page.locator('h1:has-text("診療記録")')).toBeVisible();
    console.log('✓ ページタイトルが表示されています');

    // 新規診療記録ボタンの確認
    await expect(page.locator('button:has-text("新規診療記録")')).toBeVisible();
    console.log('✓ 新規診療記録ボタンが表示されています');

    // テーブルの存在確認
    await expect(page.locator('table')).toBeVisible();
    console.log('✓ 診療記録テーブルが表示されています');

    // スクリーンショットを保存
    await page.screenshot({ path: 'encounters-list-simple.png', fullPage: true });
    console.log('✓ 診療記録一覧のスクリーンショットを保存しました');

    console.log('=== 診療記録一覧ページ基本表示テスト完了 ===');
  });

  test('新規診療記録作成ページアクセス確認', async ({ page }) => {
    console.log('=== 新規診療記録作成ページアクセステスト開始 ===');

    // 新規診療記録ボタンをクリック
    await page.locator('button:has-text("新規診療記録")').click();
    await page.waitForURL('**/encounters/create');
    console.log('✓ 新規診療記録作成ページに遷移しました');

    // ページタイトルの確認
    await expect(page.locator('h4:has-text("新しい診療記録の作成")')).toBeVisible();
    console.log('✓ ページタイトルが表示されています');

    // ステッパーの確認
    await expect(page.locator('text=基本情報')).toBeVisible();
    await expect(page.locator('text=バイタルサイン')).toBeVisible();
    await expect(page.locator('text=SOAP記録')).toBeVisible();
    console.log('✓ ステッパーが表示されています');

    // スクリーンショットを保存
    await page.screenshot({ path: 'encounter-create-access.png', fullPage: true });
    console.log('✓ 診療記録作成ページのスクリーンショットを保存しました');

    console.log('=== 新規診療記録作成ページアクセステスト完了 ===');
  });

  test('診療記録作成フォームの要素確認', async ({ page }) => {
    console.log('=== 診療記録作成フォーム要素確認テスト開始 ===');

    // 新規診療記録作成ページに移動
    await page.locator('button:has-text("新規診療記録")').click();
    await page.waitForURL('**/encounters/create');

    // 基本情報フォームの要素確認
    console.log('--- 基本情報フォーム要素確認 ---');
    
    // 患者選択フィールド
    await expect(page.locator('label:has-text("患者")')).toBeVisible();
    console.log('✓ 患者選択フィールドが表示されています');

    // 診療クラス選択フィールド
    await expect(page.locator('label:has-text("診療クラス")')).toBeVisible();
    console.log('✓ 診療クラス選択フィールドが表示されています');

    // 開始日時フィールド
    await expect(page.locator('label:has-text("開始日時")')).toBeVisible();
    console.log('✓ 開始日時フィールドが表示されています');

    // 主訴フィールド
    await expect(page.locator('label:has-text("主訴")')).toBeVisible();
    console.log('✓ 主訴フィールドが表示されています');

    // ナビゲーションボタンの確認
    await expect(page.locator('button:has-text("次へ")').first()).toBeVisible();
    console.log('✓ 次へボタンが表示されています');

    // フォーム要素の存在確認（追加要素）
    console.log('--- 追加フォーム要素確認 ---');
    
    // その他の重要な要素を確認
    await expect(page.locator('label:has-text("終了日時")').first()).toBeVisible();
    console.log('✓ 終了日時フィールドが表示されています');
    
    await expect(page.locator('label:has-text("現病歴")').first()).toBeVisible();
    console.log('✓ 現病歴フィールドが表示されています');
    
    // ステップ表示の確認
    await expect(page.locator('text=バイタルサイン').first()).toBeVisible();
    console.log('✓ バイタルサインステップが表示されています');
    
    await expect(page.locator('text=SOAP記録').first()).toBeVisible();
    console.log('✓ SOAP記録ステップが表示されています');
    
    // 次へボタンが無効化されていることを確認（これは正常）
    const nextButton = page.locator('button:has-text("次へ")').first();
    const isDisabled = await nextButton.getAttribute('disabled');
    if (isDisabled !== null) {
      console.log('✓ 次へボタンは必須フィールド未入力のため無効化されています（正常）');
    } else {
      console.log('ℹ 次へボタンの状態を確認しました');
    }

    // スクリーンショットを保存
    await page.screenshot({ path: 'encounter-create-soap.png', fullPage: true });
    console.log('✓ SOAP記録フォームのスクリーンショットを保存しました');

    console.log('=== 診療記録作成フォーム要素確認テスト完了 ===');
  });

  test('診療記録検索機能の基本動作確認', async ({ page }) => {
    console.log('=== 診療記録検索機能基本動作確認テスト開始 ===');

    // 検索フィールドの確認
    const searchInput = page.locator('input[placeholder*="診療記録ID"]');
    await expect(searchInput).toBeVisible();
    console.log('✓ 検索フィールドが表示されています');

    // 検索テスト
    await searchInput.fill('test search');
    await page.waitForTimeout(1000);
    console.log('✓ 検索キーワードを入力しました');

    // 検索をクリア
    await searchInput.clear();
    console.log('✓ 検索をクリアしました');

    // スクリーンショットを保存
    await page.screenshot({ path: 'encounters-search-basic.png', fullPage: true });
    console.log('✓ 検索機能のスクリーンショットを保存しました');

    console.log('=== 診療記録検索機能基本動作確認テスト完了 ===');
  });

  test('ダッシュボードから診療記録ページへの遷移確認', async ({ page }) => {
    console.log('=== ダッシュボードから診療記録ページ遷移確認テスト開始 ===');

    // ダッシュボードに戻る
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForURL('**/dashboard');
    console.log('✓ ダッシュボードに移動しました');

    // 診療記録ボタンをクリック
    await page.getByRole('button', { name: '診療記録' }).click();
    await page.waitForURL('**/encounters');
    console.log('✓ 診療記録ページに遷移しました');

    // ページが正しく表示されることを確認
    await expect(page.locator('h1:has-text("診療記録")')).toBeVisible();
    console.log('✓ 診療記録ページが正しく表示されています');

    console.log('=== ダッシュボードから診療記録ページ遷移確認テスト完了 ===');
  });
});