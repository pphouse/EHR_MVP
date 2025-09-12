/**
 * Encounter List Loading Debug Test
 * 診療記録一覧ページの読み込み問題デバッグ
 */

const { test, expect } = require('@playwright/test');

test.describe('Encounter List Loading Debug', () => {

  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'demo');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Debug Encounter List Loading Issues', async ({ page }) => {
    console.log('=== 診療記録一覧ページ読み込みデバッグ開始 ===');

    // ネットワークリクエスト監視
    const networkRequests = [];
    const networkErrors = [];
    
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log(`➡️ Request: ${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      console.log(`⬅️ Response: ${response.status()} ${response.url()}`);
      if (!response.ok()) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    page.on('requestfailed', request => {
      console.log(`❌ Request Failed: ${request.url()} - ${request.failure().errorText}`);
      networkErrors.push({
        url: request.url(),
        error: request.failure().errorText
      });
    });

    // Console messages
    page.on('console', msg => {
      console.log(`🖥️ Console ${msg.type()}: ${msg.text()}`);
    });

    // JavaScript errors
    page.on('pageerror', error => {
      console.log(`❌ JavaScript Error: ${error.message}`);
    });

    console.log('--- 診療記録一覧ページにアクセス ---');
    
    try {
      // ページ読み込み開始
      const navigationPromise = page.goto('http://localhost:3000/encounters');
      
      // 5秒後に状況確認
      setTimeout(async () => {
        console.log('--- 5秒経過時点での状況確認 ---');
        console.log(`現在のURL: ${page.url()}`);
        
        // ページの読み込み状況確認
        const readyState = await page.evaluate(() => document.readyState);
        console.log(`Document Ready State: ${readyState}`);
        
        // 表示されている要素確認
        const visibleElements = await page.evaluate(() => {
          const elements = [];
          if (document.querySelector('h4')) elements.push('タイトル(h4)');
          if (document.querySelector('[role="progressbar"]')) elements.push('プログレスバー');
          if (document.querySelector('.MuiAlert-root')) elements.push('アラート');
          if (document.querySelector('table')) elements.push('テーブル');
          if (document.querySelector('tbody tr')) elements.push('データ行');
          return elements;
        });
        console.log(`表示要素: ${visibleElements.join(', ')}`);
        
        // ネットワークエラー確認
        if (networkErrors.length > 0) {
          console.log('--- ネットワークエラー ---');
          networkErrors.forEach(error => {
            console.log(`❌ ${error.url}: ${error.status || error.error}`);
          });
        }
      }, 5000);
      
      // ナビゲーション完了を待つ（タイムアウト短縮）
      await navigationPromise;
      console.log('✅ ページナビゲーション完了');
      
      // DOM内容読み込み待機（タイムアウト短縮）
      console.log('--- DOM要素の読み込み待機 ---');
      
      // プログレスバーが消えるまで待つ
      const progressBar = page.locator('[role="progressbar"]');
      if (await progressBar.isVisible()) {
        console.log('⏳ プログレスバーが表示中...');
        await progressBar.waitFor({ state: 'detached', timeout: 10000 });
        console.log('✅ プログレスバーが消えました');
      }
      
      // エラーアラートをチェック
      const errorAlert = page.locator('.MuiAlert-root[role="alert"]');
      if (await errorAlert.isVisible()) {
        const errorText = await errorAlert.textContent();
        console.log(`❌ エラーアラート: ${errorText}`);
      }
      
      // テーブルの存在確認
      const table = page.locator('table');
      if (await table.isVisible()) {
        console.log('✅ テーブル要素が見つかりました');
        
        // データ行数確認
        const dataRows = page.locator('tbody tr');
        const rowCount = await dataRows.count();
        console.log(`データ行数: ${rowCount}`);
        
        if (rowCount > 0) {
          console.log('✅ データが正常に表示されています');
          
          // 最初の数行の内容確認
          for (let i = 0; i < Math.min(rowCount, 3); i++) {
            const rowText = await dataRows.nth(i).textContent();
            console.log(`行 ${i + 1}: ${rowText.substring(0, 100)}...`);
          }
        } else {
          console.log('⚠️ テーブルは存在しますがデータがありません');
        }
      } else {
        console.log('❌ テーブル要素が見つかりません');
      }
      
    } catch (error) {
      console.log(`❌ ページ読み込みエラー: ${error.message}`);
      
      // 現在の状況を詳しく確認
      console.log('--- エラー時の詳細情報 ---');
      console.log(`現在のURL: ${page.url()}`);
      
      const bodyContent = await page.evaluate(() => {
        return document.body.textContent.substring(0, 500);
      });
      console.log(`ページ内容: ${bodyContent}`);
    }

    console.log('--- API呼び出し状況確認 ---');
    const encounterApiCalls = networkRequests.filter(req => 
      req.url.includes('/encounters') && req.method === 'GET'
    );
    console.log(`診療記録API呼び出し数: ${encounterApiCalls.length}`);
    encounterApiCalls.forEach(call => {
      console.log(`📞 ${call.timestamp}: ${call.url}`);
    });

    console.log('=== 診療記録一覧ページ読み込みデバッグ完了 ===');
  });

  test('Direct Encounter API Test', async ({ page, request }) => {
    console.log('=== 直接API呼び出しテスト ===');

    // 認証トークン取得
    const authResponse = await request.post('http://localhost:8000/api/v1/auth/login', {
      data: {
        username: 'demo',
        password: 'demo123'
      }
    });
    
    if (authResponse.ok()) {
      const authData = await authResponse.json();
      const token = authData.access_token;
      console.log('✅ 認証トークン取得成功');
      
      // 診療記録一覧API直接呼び出し
      console.log('--- 診療記録一覧API直接呼び出し ---');
      const encountersResponse = await request.get('http://localhost:8000/api/v1/encounters/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`API Status: ${encountersResponse.status()}`);
      
      if (encountersResponse.ok()) {
        const encountersData = await encountersResponse.json();
        console.log(`取得した診療記録数: ${encountersData.length}`);
        
        if (encountersData.length > 0) {
          console.log('最新の診療記録:');
          const latest = encountersData[0];
          console.log(`- ID: ${latest.id}`);
          console.log(`- Encounter ID: ${latest.encounter_id}`);
          console.log(`- Patient ID: ${latest.patient_id}`);
          console.log(`- Status: ${latest.status}`);
          console.log(`- Chief Complaint: ${latest.chief_complaint}`);
        }
      } else {
        console.log(`❌ API呼び出し失敗: ${encountersResponse.status()}`);
        const errorText = await encountersResponse.text();
        console.log(`エラー詳細: ${errorText}`);
      }
    } else {
      console.log('❌ 認証失敗');
    }

    console.log('=== 直接API呼び出しテスト完了 ===');
  });
});