import { test, expect } from '@playwright/test';

test.describe('診療録作成機能デバッグテスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('http://localhost:3000');
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
  });

  test('診療録作成機能の詳細テスト', async ({ page }) => {
    console.log('診療録作成機能のデバッグ開始');
    
    // ネットワークリクエストの監視
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
    });
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    });

    // 診療記録ページに移動
    await page.goto('http://localhost:3000/encounters');
    await expect(page).toHaveURL('http://localhost:3000/encounters');
    
    // 新規診療記録作成ボタンの確認
    const newEncounterButton = page.getByRole('button', { name: /新規診療記録|診療記録作成|新規作成/ }).first();
    
    if (await newEncounterButton.isVisible()) {
      console.log('新規診療記録ボタンが見つかりました');
      await newEncounterButton.click();
    } else {
      // 別の方法で診療記録作成ページに移動
      console.log('直接URLで診療記録作成ページに移動');
      await page.goto('http://localhost:3000/encounters/create');
    }
    
    // 診療記録作成ページの確認
    await expect(page).toHaveURL('http://localhost:3000/encounters/create');
    await page.waitForTimeout(2000);
    
    // ページコンテンツの確認
    const pageTitle = await page.locator('h1, h2, h3, h4').first().textContent();
    console.log('診療記録作成ページのタイトル:', pageTitle);
    
    // 患者選択フィールドの確認
    const patientSelect = page.locator('select, [role="combobox"], input[placeholder*="患者"]').first();
    if (await patientSelect.isVisible()) {
      console.log('患者選択フィールドが見つかりました');
      
      // 患者を選択（最初の患者を選択）
      if (await patientSelect.getAttribute('role') === 'combobox') {
        await patientSelect.click();
        await page.getByRole('option').first().click();
      } else if (await patientSelect.evaluate(el => el.tagName) === 'SELECT') {
        await patientSelect.selectOption({ index: 1 }); // 最初のオプション（空でない）を選択
      }
    } else {
      console.log('患者選択フィールドが見つかりません');
    }
    
    // 必須フィールドを入力（Labelで特定）
    const chiefComplaintField = page.getByLabel('主訴');
    if (await chiefComplaintField.isVisible()) {
      await chiefComplaintField.fill('頭痛がします');
      console.log('主訴フィールドに入力しました');
    } else {
      console.log('主訴フィールドが見つかりません');
    }
    
    // 現病歴フィールド
    const historyField = page.getByLabel('現病歴');
    if (await historyField.isVisible()) {
      await historyField.fill('昨日から頭痛が続いています');
      console.log('現病歴フィールドに入力しました');
    }
    
    // ステッパーの「次へ」ボタンまたは「保存」ボタンを探す
    const nextButton = page.getByRole('button', { name: /次へ|Next/ });
    const saveButton = page.getByRole('button', { name: /保存|Save|完了/ });
    
    if (await nextButton.isVisible()) {
      console.log('次へボタンをクリック');
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // 最終ステップで保存ボタンを探す
      const finalSaveButton = page.getByRole('button', { name: /保存|Save|完了/ });
      if (await finalSaveButton.isVisible()) {
        console.log('保存ボタンをクリック');
        await finalSaveButton.click();
      }
    } else if (await saveButton.isVisible()) {
      console.log('保存ボタンをクリック');
      await saveButton.click();
    } else {
      console.log('保存ボタンが見つかりません');
    }
    
    // レスポンスを待機
    await page.waitForTimeout(3000);
    
    // ネットワークリクエストとレスポンスをログ出力
    console.log('--- 診療記録作成のリクエスト ---');
    requests.forEach(req => {
      if (req.url.includes('encounter') || req.method === 'POST') {
        console.log(`${req.method} ${req.url}`);
        if (req.postData) {
          console.log('POST Data:', req.postData);
        }
      }
    });
    
    console.log('--- 診療記録作成のレスポンス ---');
    responses.forEach(res => {
      if (res.url.includes('encounter') || res.status >= 400) {
        console.log(`${res.status} ${res.statusText} - ${res.url}`);
      }
    });
    
    // 成功メッセージまたはエラーメッセージの確認
    const successMessage = page.locator(':has-text("診療記録"), :has-text("成功"), [role="alert"]');
    const errorMessage = page.locator(':has-text("エラー"), :has-text("失敗"), [role="alert"]');
    
    if (await successMessage.isVisible()) {
      const successText = await successMessage.textContent();
      console.log('成功メッセージ:', successText);
    }
    
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.log('エラーメッセージ:', errorText);
    }
    
    // 現在のURLを確認
    const currentUrl = page.url();
    console.log('作成後のURL:', currentUrl);
    
    // スクリーンショットを保存
    await page.screenshot({ path: '/Users/naoto/EHR_MVP/e2e-tests/encounter-creation-debug.png', fullPage: true });
    console.log('デバッグ用スクリーンショットを保存しました');
    
    console.log('診療録作成機能のデバッグ完了');
  });
});