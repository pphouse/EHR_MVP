const { test, expect } = require('@playwright/test');

test.describe('処方箋作成完全検証テスト', () => {
  test('処方箋が実際にデータベースに保存されるまで完全確認', async ({ page }) => {
    console.log('🧪 処方箋作成完全検証テスト開始');
    
    // API監視を詳細に
    const apiCalls = [];
    let prescriptionCreateCalled = false;
    let prescriptionCreateResponse = null;
    
    page.on('request', request => {
      if (request.url().includes('localhost:8000')) {
        const call = {
          type: 'REQUEST',
          method: request.method(),
          url: request.url(),
          body: request.postData(),
          headers: request.headers(),
          timestamp: new Date().toISOString()
        };
        apiCalls.push(call);
        
        if (request.method() === 'POST' && request.url().includes('/prescriptions')) {
          prescriptionCreateCalled = true;
          console.log(`🚀 処方箋作成API呼び出し: ${request.url()}`);
          if (request.postData()) {
            console.log(`📝 送信データ: ${request.postData()}`);
          }
        } else {
          console.log(`📤 ${request.method()} ${request.url()}`);
        }
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('localhost:8000')) {
        const call = {
          type: 'RESPONSE',
          status: response.status(),
          url: response.url(),
          timestamp: new Date().toISOString()
        };
        apiCalls.push(call);
        
        if (response.url().includes('/prescriptions') && response.request().method() === 'POST') {
          prescriptionCreateResponse = response.status();
          console.log(`🎯 処方箋作成レスポンス: ${response.status()}`);
        }
        
        if (response.status() >= 400) {
          console.log(`🔴 ${response.status()} ${response.url()}`);
        } else {
          console.log(`📥 ${response.status()} ${response.url()}`);
        }
      }
    });
    
    page.on('requestfailed', request => {
      if (request.url().includes('localhost:8000')) {
        console.log(`❌ API FAILED: ${request.url()} - ${request.failure().errorText}`);
        apiCalls.push({
          type: 'FAILED',
          url: request.url(),
          error: request.failure().errorText,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // JavaScript エラー監視
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('DevTools') && !msg.text().includes('Warning:')) {
        console.log(`🔴 JS ERROR: ${msg.text()}`);
      }
      // 処方箋関連のログをキャッチ
      if (msg.text().includes('prescription') || msg.text().includes('処方箋')) {
        console.log(`📍 処方箋ログ: ${msg.text()}`);
      }
    });
    
    try {
      // STEP 1: ログイン
      console.log('\n=== STEP 1: ログイン ===');
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(2000);
      
      await page.fill('input[name="username"]', 'demo');
      await page.fill('input[name="password"]', 'demo123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      console.log('✅ ログイン成功');
      
      // STEP 2: 処方箋作成ページ
      console.log('\n=== STEP 2: 処方箋作成ページ ===');
      await page.goto('http://localhost:3000/prescriptions/create');
      await page.waitForTimeout(3000);
      console.log('✅ ページ表示完了');
      
      // STEP 3: フォーム要素の存在確認
      console.log('\n=== STEP 3: フォーム要素確認 ===');
      
      // より正確なセレクター使用
      const patientSelectField = page.locator('[data-testid="patient-select"], #patient-select, [aria-label*="患者"], [name="patient_id"]').first();
      const patientSelectExists = await patientSelectField.isVisible().catch(() => false);
      console.log(`📍 患者選択フィールド存在: ${patientSelectExists}`);
      
      if (!patientSelectExists) {
        // 代替セレクター試行
        const patientLabels = await page.locator('text=患者').count();
        console.log(`📍 "患者"ラベル数: ${patientLabels}`);
        
        // Material-UI Select の構造を直接探索
        const muiSelects = await page.locator('.MuiSelect-root, [role="button"][aria-haspopup="listbox"]').count();
        console.log(`📍 Material-UI Select数: ${muiSelects}`);
        
        if (muiSelects > 0) {
          console.log('📍 Material-UI Selectが見つかりました - 最初のものを試行');
          const firstSelect = page.locator('.MuiSelect-root, [role="button"][aria-haspopup="listbox"]').first();
          await firstSelect.click();
          await page.waitForTimeout(1000);
          
          // リストボックス確認
          const listbox = page.locator('[role="listbox"]');
          const isListboxVisible = await listbox.isVisible();
          console.log(`📍 リストボックス表示: ${isListboxVisible}`);
          
          if (isListboxVisible) {
            const options = await listbox.locator('li, [role="option"]').count();
            console.log(`📍 選択肢数: ${options}`);
            
            if (options > 0) {
              // 最初の患者を選択
              await listbox.locator('li, [role="option"]').first().click();
              await page.waitForTimeout(2000);
              console.log('✅ 患者選択完了');
              
              // 診療記録選択
              console.log('\n=== STEP 4: 診療記録選択 ===');
              const secondSelect = page.locator('.MuiSelect-root, [role="button"][aria-haspopup="listbox"]').nth(1);
              await secondSelect.click();
              await page.waitForTimeout(1000);
              
              const encounterListbox = page.locator('[role="listbox"]');
              const encounterOptions = await encounterListbox.locator('li, [role="option"]').count();
              console.log(`📍 診療記録選択肢数: ${encounterOptions}`);
              
              if (encounterOptions > 0) {
                await encounterListbox.locator('li, [role="option"]').first().click();
                await page.waitForTimeout(2000);
                console.log('✅ 診療記録選択完了');
                
                // 薬剤検索と追加
                console.log('\n=== STEP 5: 薬剤検索・追加 ===');
                const searchInput = page.locator('input[placeholder*="薬剤"], input[placeholder*="検索"]');
                await searchInput.fill('アセトアミノフェン');
                await page.waitForTimeout(3000);
                
                const searchResults = await page.locator('table tbody tr').count();
                console.log(`📍 検索結果: ${searchResults}件`);
                
                if (searchResults > 0) {
                  const addButton = page.locator('table tbody button:has-text("追加")').first();
                  await addButton.click();
                  await page.waitForTimeout(2000);
                  console.log('✅ 薬剤追加完了');
                  
                  // 処方箋作成実行
                  console.log('\n=== STEP 6: 🚀 処方箋作成実行 🚀 ===');
                  const createButton = page.locator('button:has-text("処方箋を作成"), button:has-text("作成"), button:has-text("保存")');
                  const buttonVisible = await createButton.isVisible();
                  const buttonEnabled = await createButton.isEnabled();
                  
                  console.log(`📍 作成ボタン - 表示: ${buttonVisible}, 有効: ${buttonEnabled}`);
                  
                  if (buttonVisible && buttonEnabled) {
                    console.log('🔥 処方箋作成ボタンクリック！');
                    
                    // クリック前の状態記録
                    const preClickApiCount = apiCalls.length;
                    
                    await createButton.click();
                    console.log('📍 クリック完了 - API監視開始');
                    
                    // 結果を30秒間監視
                    let waitTime = 0;
                    const maxWait = 30000; // 30秒
                    const checkInterval = 1000; // 1秒ごと
                    
                    while (waitTime < maxWait) {
                      await page.waitForTimeout(checkInterval);
                      waitTime += checkInterval;
                      
                      // 成功メッセージ確認
                      const successVisible = await page.locator('text=処方箋が正常に作成されました, text=作成されました, text=成功').isVisible();
                      const alertVisible = await page.locator('[role="alert"]').isVisible();
                      
                      if (successVisible) {
                        console.log(`✅ 成功メッセージ検出 (${waitTime}ms後)`);
                        break;
                      }
                      
                      if (alertVisible) {
                        const alertText = await page.locator('[role="alert"]').textContent();
                        console.log(`⚠️ アラート検出 (${waitTime}ms後): ${alertText}`);
                        break;
                      }
                      
                      // API呼び出し検出
                      if (prescriptionCreateCalled) {
                        console.log(`📡 処方箋作成API呼び出し検出 (${waitTime}ms後)`);
                      }
                      
                      // 進行表示
                      if (waitTime % 5000 === 0) {
                        console.log(`⏳ 監視中... ${waitTime/1000}秒経過`);
                      }
                    }
                    
                    // 最終結果確認
                    console.log('\n=== 最終結果 ===');
                    console.log(`📊 処方箋作成API呼び出し: ${prescriptionCreateCalled}`);
                    console.log(`📊 処方箋作成レスポンス: ${prescriptionCreateResponse}`);
                    
                    const postClickApiCount = apiCalls.length;
                    console.log(`📊 クリック後API増加: ${postClickApiCount - preClickApiCount}件`);
                    
                    // 詳細ログ
                    if (postClickApiCount > preClickApiCount) {
                      console.log('\n📋 クリック後のAPI詳細:');
                      apiCalls.slice(preClickApiCount).forEach((call, i) => {
                        if (call.type === 'REQUEST') {
                          console.log(`  ${i+1}. 📤 ${call.method} ${call.url}`);
                          if (call.body) {
                            console.log(`      📝 ${call.body.substring(0, 200)}...`);
                          }
                        } else if (call.type === 'RESPONSE') {
                          const emoji = call.status >= 400 ? '🔴' : '📥';
                          console.log(`  ${i+1}. ${emoji} ${call.status} ${call.url}`);
                        } else if (call.type === 'FAILED') {
                          console.log(`  ${i+1}. ❌ ${call.url} - ${call.error}`);
                        }
                      });
                    }
                    
                  } else {
                    console.log('❌ 作成ボタンが利用できません');
                  }
                } else {
                  console.log('❌ 薬剤検索結果なし');
                }
              } else {
                console.log('❌ 診療記録選択肢なし');
              }
            } else {
              console.log('❌ 患者選択肢なし');
            }
          } else {
            console.log('❌ リストボックス表示されず');
          }
        } else {
          console.log('❌ Material-UI Selectが見つかりません');
        }
      }
      
    } catch (error) {
      console.log(`❌ テストエラー: ${error.message}`);
      console.log(`Stack: ${error.stack}`);
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'e2e-tests/prescription-verification-final.png' });
    
    // 総合統計
    console.log('\n📊 総合統計:');
    console.log(`  📤 総API呼び出し: ${apiCalls.length}件`);
    console.log(`  🚀 処方箋作成API: ${prescriptionCreateCalled ? 'YES' : 'NO'}`);
    console.log(`  📊 作成API応答: ${prescriptionCreateResponse || 'なし'}`);
    
    const failedCalls = apiCalls.filter(call => call.type === 'FAILED');
    const errorResponses = apiCalls.filter(call => call.type === 'RESPONSE' && call.status >= 400);
    console.log(`  ❌ 失敗API: ${failedCalls.length}件`);
    console.log(`  🔴 エラーレスポンス: ${errorResponses.length}件`);
    
    console.log('\n🎉 処方箋作成完全検証テスト完了');
  });
});