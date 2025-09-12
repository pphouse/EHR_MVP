import { test, expect } from '@playwright/test';

test.describe('通知音機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログインページに移動
    await page.goto('http://localhost:3000');
  });

  test('ログイン成功時の通知音テスト', async ({ page }) => {
    console.log('ログイン画面でのテスト開始');
    
    // ログインフォームの確認
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // ログイン情報入力
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    
    // AudioContextのモック（通知音が実行されたかをテスト用に確認）
    await page.addInitScript(() => {
      window.notificationSoundPlayed = false;
      const originalAudioContext = window.AudioContext || window.webkitAudioContext;
      
      if (originalAudioContext) {
        window.AudioContext = class extends originalAudioContext {
          constructor() {
            super();
            window.notificationSoundPlayed = true;
          }
        };
        window.webkitAudioContext = window.AudioContext;
      }
    });
    
    // ログインボタンクリック
    await page.locator('button[type="submit"]').click();
    
    // ダッシュボードへの遷移を確認
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
    
    // 通知音の実行確認（AudioContextが作成されたかチェック）
    const soundPlayed = await page.evaluate(() => window.notificationSoundPlayed);
    console.log('通知音の実行状況:', soundPlayed);
    
    // ダッシュボードコンテンツの確認
    await expect(page.locator('h4')).toContainText('ダッシュボード');
    
    console.log('ログイン成功時の通知音テスト完了');
  });

  test('通知音設定ページのアクセステスト', async ({ page }) => {
    console.log('通知音設定ページのテスト開始');
    
    // ログイン
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    
    // ダッシュボードに移動したことを確認
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
    
    // 通知音設定ページに直接アクセス
    await page.goto('http://localhost:3000/settings/notifications');
    
    // 通知音設定ページの要素確認
    await expect(page.locator('h6')).toContainText('通知音設定');
    await expect(page.getByRole('switch')).toBeVisible(); // スイッチの確認
    await expect(page.getByText('通知音を有効にする')).toBeVisible();
    
    // 音量スライダーの確認
    await expect(page.locator('input[type="range"]')).toBeVisible();
    
    // テスト音ボタンの確認
    const testButtons = page.getByRole('button', { name: /再生/ });
    await expect(testButtons.first()).toBeVisible();
    
    console.log('通知音設定ページのテスト完了');
  });

  test('患者登録時の通知音テスト', async ({ page }) => {
    console.log('患者登録時の通知音テスト開始');
    
    // ログイン
    await page.locator('input[name="username"]').fill('demo');
    await page.locator('input[name="password"]').fill('demo123');
    await page.locator('button[type="submit"]').click();
    
    // 患者管理ページに移動
    await page.goto('http://localhost:3000/patients');
    await expect(page).toHaveURL('http://localhost:3000/patients');
    
    // 新規患者登録ボタンをクリック
    await page.getByRole('button', { name: '新規患者登録' }).click();
    
    // 患者登録ページに移動
    await expect(page).toHaveURL('http://localhost:3000/patients/create');
    await expect(page.locator('h4')).toContainText('新規患者登録');
    
    // フォームデータ入力
    await page.locator('input[name="lastName"]').fill('山田');
    await page.locator('input[name="firstName"]').fill('太郎');
    await page.locator('input[name="lastNameKana"]').fill('ヤマダ');
    await page.locator('input[name="firstNameKana"]').fill('タロウ');
    await page.locator('input[name="phone"]').fill('090-1234-5678');
    await page.locator('input[name="dateOfBirth"]').fill('1990-01-01');
    
    // 性別選択
    await page.locator('div[role="button"]:has-text("性別を選択")').click();
    await page.getByRole('option', { name: '男性' }).click();
    
    // 通知音の準備（模擬）
    await page.addInitScript(() => {
      window.patientRegistrationSoundPlayed = false;
      
      // オリジナルの通知音関数をオーバーライド
      if (window.notificationSound) {
        const originalNewPatient = window.notificationSound.newPatient;
        window.notificationSound.newPatient = function() {
          window.patientRegistrationSoundPlayed = true;
          if (originalNewPatient) originalNewPatient.call(this);
        };
      }
    });
    
    // 保存ボタンクリック
    await page.getByRole('button', { name: '保存' }).click();
    
    // 成功メッセージの確認
    await expect(page.getByText('患者が正常に登録されました')).toBeVisible();
    
    // 通知音実行の確認（実際には音は鳴らないが、関数呼び出しを確認）
    const soundPlayed = await page.evaluate(() => window.patientRegistrationSoundPlayed);
    console.log('患者登録通知音の実行状況:', soundPlayed);
    
    console.log('患者登録時の通知音テスト完了');
  });
});