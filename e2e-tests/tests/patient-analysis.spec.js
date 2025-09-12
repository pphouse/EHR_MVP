const { test, expect } = require('@playwright/test');

test.describe('患者管理機能の詳細分析', () => {
  test.beforeEach(async ({ page }) => {
    // ログインして患者管理ページに移動
    await page.goto('http://localhost:3000');
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
    await page.getByRole('button', { name: '患者管理' }).click();
    await page.waitForURL('**/patients');
  });

  test('患者管理ページの構造と要素を詳細分析', async ({ page }) => {
    console.log('=== 患者管理ページの詳細分析を開始 ===');

    // ページの基本構造を確認
    await expect(page.getByRole('heading', { name: '患者管理' })).toBeVisible();
    console.log('✓ ページタイトルが表示されています');

    // 新規患者登録ボタンの確認
    const newPatientButton = page.locator('button:has-text("新規患者登録"), button:has-text("患者登録"), button:has-text("新規登録"), button:has-text("追加")');
    const newPatientButtonExists = await newPatientButton.isVisible().catch(() => false);
    if (newPatientButtonExists) {
      console.log('✓ 新規患者登録ボタンが見つかりました');
      const buttonText = await newPatientButton.textContent();
      console.log(`  ボタンテキスト: "${buttonText}"`);
    } else {
      console.log('⚠ 新規患者登録ボタンが見つかりません');
    }

    // 検索機能の確認
    const searchInput = page.locator('input[placeholder*="検索"], input[placeholder*="患者"], input[type="search"], input[name*="search"]');
    const searchExists = await searchInput.isVisible().catch(() => false);
    if (searchExists) {
      console.log('✓ 検索フィールドが見つかりました');
      const placeholder = await searchInput.getAttribute('placeholder');
      console.log(`  プレースホルダー: "${placeholder}"`);
    } else {
      console.log('⚠ 検索フィールドが見つかりません');
    }

    // 患者リストテーブルの確認
    const tableSelectors = [
      'table',
      '.MuiDataGrid-root',
      '[role="table"]',
      '.patients-table',
      '.patient-list'
    ];

    let tableFound = false;
    for (const selector of tableSelectors) {
      const table = page.locator(selector);
      const exists = await table.isVisible().catch(() => false);
      if (exists) {
        console.log(`✓ 患者テーブルが見つかりました (${selector})`);
        tableFound = true;
        
        // テーブルのヘッダーを確認
        const headers = await table.locator('th, .MuiDataGrid-columnHeader').allTextContents().catch(() => []);
        if (headers.length > 0) {
          console.log(`  テーブルヘッダー: ${headers.join(', ')}`);
        }
        
        // 患者データの行数を確認
        const rows = await table.locator('tr:has(td), .MuiDataGrid-row').count().catch(() => 0);
        console.log(`  患者データ行数: ${rows}`);
        break;
      }
    }

    if (!tableFound) {
      console.log('⚠ 患者テーブルが見つかりません');
    }

    // 患者情報の表示内容を確認
    const patientData = await page.textContent('body');
    const hasPatientInfo = patientData.includes('田中') || patientData.includes('佐藤') || patientData.includes('山田');
    if (hasPatientInfo) {
      console.log('✓ 患者データが表示されています');
    } else {
      console.log('⚠ 患者データが表示されていません');
    }

    // ページング機能の確認
    const pagingSelectors = [
      'button:has-text("次"), button:has-text("前")',
      '.MuiPagination-root',
      '.pagination',
      'button:has-text(">")'
    ];

    for (const selector of pagingSelectors) {
      const paging = page.locator(selector);
      const exists = await paging.isVisible().catch(() => false);
      if (exists) {
        console.log(`✓ ページング機能が見つかりました (${selector})`);
        break;
      }
    }

    // アクション機能の確認（編集、削除、詳細表示）
    const actionSelectors = [
      'button:has-text("編集")',
      'button:has-text("削除")',
      'button:has-text("詳細")',
      'button:has-text("表示")',
      '.action-button',
      '[data-testid*="action"]'
    ];

    for (const selector of actionSelectors) {
      const action = page.locator(selector);
      const count = await action.count().catch(() => 0);
      if (count > 0) {
        const text = await action.first().textContent().catch(() => '');
        console.log(`✓ アクションボタンが見つかりました: "${text}" (${count}個)`);
      }
    }

    // スクリーンショットを保存
    await page.screenshot({ path: 'patient-management-analysis.png', fullPage: true });
    console.log('✓ 分析結果のスクリーンショットを保存しました');

    console.log('=== 患者管理ページの詳細分析完了 ===');
  });

  test('患者詳細ページへの遷移を分析', async ({ page }) => {
    console.log('=== 患者詳細ページ遷移の分析を開始 ===');

    // 患者の詳細を表示する要素を探す
    const detailLinks = [
      'a[href*="/patients/"]',
      'button:has-text("詳細")',
      'button:has-text("表示")',
      'td:first-child a',
      '.patient-name a',
      'tr td:first-child'
    ];

    let detailLinkFound = false;
    for (const selector of detailLinks) {
      const link = page.locator(selector);
      const count = await link.count().catch(() => 0);
      if (count > 0) {
        console.log(`✓ 患者詳細リンクが見つかりました (${selector}): ${count}個`);
        
        try {
          // 最初のリンクをクリックしてみる
          await link.first().click();
          await page.waitForTimeout(2000);
          
          const currentUrl = page.url();
          console.log(`  遷移後URL: ${currentUrl}`);
          
          if (currentUrl.includes('/patients/') && currentUrl !== page.url().replace(/\/patients\/.*/, '/patients')) {
            console.log('✓ 患者詳細ページに正常に遷移しました');
            
            // 詳細ページの内容を確認
            const content = await page.textContent('body');
            console.log(`  詳細ページ内容: ${content.substring(0, 200)}...`);
            
            // スクリーンショットを保存
            await page.screenshot({ path: 'patient-detail-page.png', fullPage: true });
            detailLinkFound = true;
          }
          break;
        } catch (error) {
          console.log(`  ${selector} のクリックに失敗: ${error.message}`);
        }
      }
    }

    if (!detailLinkFound) {
      console.log('⚠ 患者詳細ページへの遷移機能が見つかりませんでした');
    }

    console.log('=== 患者詳細ページ遷移の分析完了 ===');
  });
});