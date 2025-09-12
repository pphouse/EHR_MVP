const { test, expect } = require('@playwright/test');

test.describe('処方箋デバッグ最終版', () => {
  test('処方箋作成エラーの詳細をキャプチャ', async ({ page }) => {
    console.log('🧪 処方箋デバッグ最終版テスト開始');
    
    // ネットワークタブを詳細に監視
    const networkLogs = [];
    
    page.on('request', request => {
      if (request.url().includes('localhost:8000')) {
        console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
        if (request.postData()) {
          console.log(`📝 POST DATA: ${request.postData()}`);
        }
        const headers = request.headers();
        console.log(`📋 HEADERS:`, headers);
        
        networkLogs.push({
          type: 'REQUEST',
          method: request.method(),
          url: request.url(),
          headers: headers,
          body: request.postData()
        });
      }
    });
    
    page.on('response', async response => {
      if (response.url().includes('localhost:8000')) {
        let responseBody = '';
        try {
          responseBody = await response.text();
        } catch (e) {
          responseBody = `Error reading body: ${e.message}`;
        }
        
        console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
        console.log(`📄 RESPONSE BODY: ${responseBody}`);
        console.log(`📋 RESPONSE HEADERS:`, response.headers());
        
        networkLogs.push({
          type: 'RESPONSE',
          status: response.status(),
          url: response.url(),
          headers: response.headers(),
          body: responseBody
        });
      }
    });
    
    page.on('requestfailed', request => {
      if (request.url().includes('localhost:8000')) {
        console.log(`❌ REQUEST FAILED: ${request.url()}`);
        console.log(`❌ FAILURE REASON: ${request.failure().errorText}`);
        
        networkLogs.push({
          type: 'FAILED',
          url: request.url(),
          error: request.failure().errorText
        });
      }
    });
    
    // JavaScriptエラーも詳細にキャプチャ
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 JS ERROR: ${msg.text()}`);
      } else if (msg.text().includes('prescription') || msg.text().includes('処方箋')) {
        console.log(`📍 JS LOG: ${msg.text()}`);
      }
    });
    
    try {
      // ログイン
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="username"]', 'demo');
      await page.fill('input[name="password"]', 'demo123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      console.log('✅ ログイン完了');
      
      // 処方箋作成ページ
      await page.goto('http://localhost:3000/prescriptions/create');
      await page.waitForTimeout(3000);
      console.log('✅ 処方箋作成ページ表示');
      
      // 患者選択
      const patientSelect = page.locator('label:has-text("患者") ~ div [tabindex="0"]').first();
      await patientSelect.click();
      await page.waitForTimeout(1000);
      
      const patientListbox = page.locator('[role="listbox"]:has(li:has-text("P00"))').first();
      await patientListbox.waitFor({ state: 'visible', timeout: 5000 });
      await patientListbox.locator('li').first().click();
      await page.waitForTimeout(2000);
      console.log('✅ 患者選択完了');
      
      // 診療記録選択
      const encounterSelect = page.locator('label:has-text("診療記録") ~ div [tabindex="0"]').first();
      await encounterSelect.click();
      await page.waitForTimeout(1000);
      
      const encounterListbox = page.locator('[role="listbox"]:has(li:has-text("E00"))').first();
      await encounterListbox.waitFor({ state: 'visible', timeout: 5000 });
      await encounterListbox.locator('li').first().click();
      await page.waitForTimeout(2000);
      console.log('✅ 診療記録選択完了');
      
      // 薬剤検索と追加
      const searchInput = page.locator('input[placeholder*="薬剤名"]');
      await searchInput.fill('アセトアミノフェン');
      await page.waitForTimeout(3000);
      
      const addButton = page.locator('table tbody button:has-text("追加")').first();
      await addButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ 薬剤追加完了');
      
      // 🚀 処方箋作成 - 詳細ログ付き
      console.log('\\n=== 🚀 処方箋作成実行開始 🚀 ===');
      const createButton = page.locator('button:has-text("処方箋を作成")');
      
      console.log(`📍 作成ボタン発見: ${await createButton.count()}個`);
      console.log(`📍 作成ボタン表示: ${await createButton.isVisible()}`);
      console.log(`📍 作成ボタン有効: ${await createButton.isEnabled()}`);
      
      const preNetworkCount = networkLogs.length;
      console.log(`📊 クリック前ネットワークログ数: ${preNetworkCount}`);
      
      console.log('🔥 処方箋作成ボタンクリック！');
      await createButton.click();
      
      // 詳細監視（20秒間）
      console.log('⏳ 20秒間詳細監視開始...');
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(1000);
        
        // UI状態確認
        const successVisible = await page.locator('text=処方箋が正常に作成されました').isVisible();
        const alertVisible = await page.locator('[role="alert"]').isVisible();
        
        if (successVisible) {
          console.log(`🎉 成功メッセージ表示 (${i+1}秒後)`);
          break;
        }
        
        if (alertVisible) {
          const alertText = await page.locator('[role="alert"]').textContent();
          console.log(`⚠️ アラートメッセージ: "${alertText}" (${i+1}秒後)`);
          break;
        }
        
        // 5秒ごとに進行表示
        if ((i + 1) % 5 === 0) {
          const currentNetworkCount = networkLogs.length;
          console.log(`⏳ ${i+1}秒経過 - ネットワークアクティビティ: ${currentNetworkCount - preNetworkCount}件`);
        }
      }
      
      // 最終ネットワークログ分析
      const postNetworkLogs = networkLogs.slice(preNetworkCount);
      console.log(`\\n🔍 === クリック後ネットワーク活動詳細 ===`);
      console.log(`📊 総ネットワークアクティビティ: ${postNetworkLogs.length}件`);
      
      if (postNetworkLogs.length > 0) {
        console.log(`\\n📋 詳細ログ:`);
        postNetworkLogs.forEach((log, i) => {
          console.log(`\\n${i+1}. ${log.type}: ${log.method || ''} ${log.url}`);
          
          if (log.type === 'REQUEST') {
            if (log.body) {
              console.log(`   📝 Body: ${log.body.substring(0, 200)}...`);
            }
            if (log.headers && log.headers['authorization']) {
              console.log(`   🔑 Authorization: ${log.headers['authorization'].substring(0, 30)}...`);
            }
          } else if (log.type === 'RESPONSE') {
            console.log(`   📊 Status: ${log.status}`);
            if (log.body) {
              console.log(`   📄 Body: ${log.body}`);
            }
          } else if (log.type === 'FAILED') {
            console.log(`   ❌ Error: ${log.error}`);
          }
        });
      } else {
        console.log(`⚠️ クリック後にネットワーク活動が検出されませんでした`);
        console.log(`   これは以下の可能性があります：`);
        console.log(`   1. ボタンクリックが機能していない`);
        console.log(`   2. フォーム検証でエラーが発生している`);
        console.log(`   3. JavaScript エラーが発生している`);
      }
      
      // 処方箋API呼び出しの詳細分析
      const prescriptionRequests = postNetworkLogs.filter(log => 
        log.type === 'REQUEST' && 
        log.url.includes('/prescriptions/') && 
        log.method === 'POST'
      );
      
      const prescriptionResponses = postNetworkLogs.filter(log => 
        log.type === 'RESPONSE' && 
        log.url.includes('/prescriptions/')
      );
      
      console.log(`\\n🎯 処方箋API分析:`);
      console.log(`📤 処方箋作成リクエスト: ${prescriptionRequests.length}件`);
      console.log(`📥 処方箋作成レスポンス: ${prescriptionResponses.length}件`);
      
      if (prescriptionRequests.length > 0) {
        console.log(`\\n📝 処方箋リクエスト詳細:`);
        prescriptionRequests.forEach((req, i) => {
          console.log(`  ${i+1}. ${req.method} ${req.url}`);
          if (req.body) {
            console.log(`     Body: ${req.body}`);
          }
        });
      }
      
      if (prescriptionResponses.length > 0) {
        console.log(`\\n📥 処方箋レスポンス詳細:`);
        prescriptionResponses.forEach((res, i) => {
          console.log(`  ${i+1}. Status: ${res.status}`);
          console.log(`     Body: ${res.body}`);
        });
      }
      
    } catch (error) {
      console.log(`❌ テストエラー: ${error.message}`);
      console.log(`Stack: ${error.stack}`);
    }
    
    await page.screenshot({ path: 'e2e-tests/prescription-debug-final.png' });
    console.log('\\n🎉 処方箋デバッグ最終版テスト完了');
  });
});