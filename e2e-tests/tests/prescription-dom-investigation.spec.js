const { test, expect } = require('@playwright/test');

test.describe('処方箋DOM調査テスト', () => {
  test('処方箋ページのDOM構造を詳細に調査', async ({ page }) => {
    console.log('🧪 処方箋DOM調査テスト開始');
    
    try {
      // ログイン
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="username"]', 'demo');
      await page.fill('input[name="password"]', 'demo123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      
      // 処方箋作成ページ
      await page.goto('http://localhost:3000/prescriptions/create');
      await page.waitForTimeout(5000); // 十分な読み込み時間
      
      console.log('\n=== DOM構造調査 ===');
      
      // 1. ページ全体のHTML出力（一部）
      const pageHTML = await page.content();
      console.log(`📍 ページHTMLサイズ: ${pageHTML.length} characters`);
      
      // 2. 患者関連の要素を全て探索
      console.log('\n--- 患者関連要素 ---');
      const patientElements = await page.locator('*:has-text("患者")').count();
      console.log(`📍 "患者"を含む要素数: ${patientElements}`);
      
      for (let i = 0; i < Math.min(patientElements, 5); i++) {
        const element = page.locator('*:has-text("患者")').nth(i);
        const tagName = await element.evaluate(el => el.tagName);
        const className = await element.getAttribute('class') || '';
        const textContent = await element.textContent();
        console.log(`  ${i+1}. ${tagName}.${className}: "${textContent}"`);
      }
      
      // 3. Select関連の要素探索
      console.log('\n--- Select関連要素 ---');
      const selectElements = await page.locator('select, [role="button"][aria-haspopup], .MuiSelect-root, [class*="Select"]').count();
      console.log(`📍 Select系要素数: ${selectElements}`);
      
      for (let i = 0; i < selectElements; i++) {
        const element = page.locator('select, [role="button"][aria-haspopup], .MuiSelect-root, [class*="Select"]').nth(i);
        const tagName = await element.evaluate(el => el.tagName);
        const className = await element.getAttribute('class') || '';
        const role = await element.getAttribute('role') || '';
        const ariaHaspopup = await element.getAttribute('aria-haspopup') || '';
        console.log(`  ${i+1}. ${tagName}.${className} role="${role}" aria-haspopup="${ariaHaspopup}"`);
      }
      
      // 4. Material-UI関連のクラス探索
      console.log('\n--- Material-UI要素 ---');
      const muiElements = await page.locator('[class*="Mui"]').count();
      console.log(`📍 MUI要素数: ${muiElements}`);
      
      // 5. 基本情報カード内の要素詳細調査
      console.log('\n--- 基本情報カード内容 ---');
      const basicInfoCard = page.locator('text=基本情報').locator('..');
      const cardExists = await basicInfoCard.isVisible();
      console.log(`📍 基本情報カード存在: ${cardExists}`);
      
      if (cardExists) {
        // カード内のフォーム要素
        const cardInputs = await basicInfoCard.locator('input, select, button, [role="button"]').count();
        console.log(`📍 カード内フォーム要素数: ${cardInputs}`);
        
        for (let i = 0; i < Math.min(cardInputs, 10); i++) {
          const input = basicInfoCard.locator('input, select, button, [role="button"]').nth(i);
          const tagName = await input.evaluate(el => el.tagName);
          const type = await input.getAttribute('type') || '';
          const className = await input.getAttribute('class') || '';
          const placeholder = await input.getAttribute('placeholder') || '';
          const role = await input.getAttribute('role') || '';
          console.log(`  ${i+1}. ${tagName}[type="${type}"] role="${role}" class="${className.substring(0, 50)}..." placeholder="${placeholder}"`);
        }
      }
      
      // 6. 実際にクリック可能な要素を特定
      console.log('\n--- クリック可能要素テスト ---');
      
      // 患者フィールド周辺の詳細調査
      const patientLabel = page.locator('text=患者').first();
      const patientContainer = patientLabel.locator('..');
      
      console.log('📍 患者ラベル周辺のクリック可能要素:');
      const clickableInPatient = await patientContainer.locator('button, [role="button"], input, select').count();
      
      for (let i = 0; i < clickableInPatient; i++) {
        const clickable = patientContainer.locator('button, [role="button"], input, select').nth(i);
        const tagName = await clickable.evaluate(el => el.tagName);
        const isVisible = await clickable.isVisible();
        const isEnabled = await clickable.isEnabled();
        const className = await clickable.getAttribute('class') || '';
        console.log(`  ${i+1}. ${tagName} visible=${isVisible} enabled=${isEnabled} class="${className.substring(0, 50)}..."`);
        
        // 実際にクリックを試行
        if (isVisible && isEnabled) {
          try {
            console.log(`    🔄 クリック試行中...`);
            await clickable.click({ timeout: 3000 });
            await page.waitForTimeout(1000);
            
            // クリック後の変化確認
            const listboxAppeared = await page.locator('[role="listbox"]').isVisible();
            console.log(`    📋 リストボックス表示: ${listboxAppeared}`);
            
            if (listboxAppeared) {
              const options = await page.locator('[role="listbox"] li, [role="listbox"] [role="option"]').count();
              console.log(`    📋 選択肢数: ${options}`);
              
              if (options > 0) {
                console.log('    🎯 患者選択ドロップダウン発見！');
                
                // 最初の患者を選択してみる
                const firstOption = page.locator('[role="listbox"] li, [role="listbox"] [role="option"]').first();
                const optionText = await firstOption.textContent();
                console.log(`    📍 最初の選択肢: ${optionText}`);
                
                await firstOption.click();
                await page.waitForTimeout(2000);
                console.log('    ✅ 患者選択完了');
                
                // 診療記録選択も試行
                console.log('\n--- 診療記録選択試行 ---');
                
                // 2番目のSelect要素を探す
                const secondClickable = patientContainer.locator('button, [role="button"]').nth(1);
                const secondExists = await secondClickable.isVisible().catch(() => false);
                
                if (secondExists) {
                  console.log('📍 2番目のSelect要素発見 - 診療記録選択試行');
                  await secondClickable.click();
                  await page.waitForTimeout(1000);
                  
                  const encounterListbox = await page.locator('[role="listbox"]').isVisible();
                  if (encounterListbox) {
                    const encounterOptions = await page.locator('[role="listbox"] li, [role="listbox"] [role="option"]').count();
                    console.log(`📍 診療記録選択肢数: ${encounterOptions}`);
                    
                    if (encounterOptions > 0) {
                      await page.locator('[role="listbox"] li, [role="listbox"] [role="option"]').first().click();
                      await page.waitForTimeout(2000);
                      console.log('✅ 診療記録選択完了');
                      
                      // 薬剤検索・追加・処方箋作成を実行
                      console.log('\n--- 完全フロー実行 ---');
                      
                      const searchInput = page.locator('input[placeholder*="薬剤"]');
                      await searchInput.fill('アセトアミノフェン');
                      await page.waitForTimeout(3000);
                      
                      const searchResults = await page.locator('table tbody tr').count();
                      console.log(`📍 薬剤検索結果: ${searchResults}件`);
                      
                      if (searchResults > 0) {
                        const addButton = page.locator('table tbody button:has-text("追加")').first();
                        await addButton.click();
                        await page.waitForTimeout(2000);
                        console.log('✅ 薬剤追加完了');
                        
                        // 処方箋作成ボタンクリック
                        const createButton = page.locator('button:has-text("処方箋を作成")');
                        const buttonVisible = await createButton.isVisible();
                        
                        if (buttonVisible) {
                          console.log('🚀 処方箋作成ボタンクリック！');
                          
                          // ネットワーク監視開始
                          let prescriptionApiCalled = false;
                          
                          page.on('request', request => {
                            if (request.url().includes('/prescriptions') && request.method() === 'POST') {
                              prescriptionApiCalled = true;
                              console.log(`🎯 処方箋作成API呼び出し検出: ${request.url()}`);
                            }
                          });
                          
                          page.on('response', response => {
                            if (response.url().includes('/prescriptions') && response.request().method() === 'POST') {
                              console.log(`🎯 処方箋作成API応答: ${response.status()}`);
                            }
                          });
                          
                          await createButton.click();
                          
                          // 結果監視（10秒）
                          for (let wait = 0; wait < 10000; wait += 1000) {
                            await page.waitForTimeout(1000);
                            
                            const success = await page.locator('text=処方箋が正常に作成されました').isVisible();
                            const alert = await page.locator('[role="alert"]').isVisible();
                            
                            if (success) {
                              console.log('🎉 処方箋作成成功メッセージ確認！');
                              break;
                            }
                            
                            if (alert) {
                              const alertText = await page.locator('[role="alert"]').textContent();
                              console.log(`⚠️ アラート: ${alertText}`);
                              break;
                            }
                            
                            console.log(`⏳ 待機中... ${wait/1000 + 1}秒経過`);
                          }
                          
                          console.log(`📊 処方箋API呼び出し検出: ${prescriptionApiCalled}`);
                        }
                      }
                    }
                  }
                } else {
                  console.log('❌ 2番目のSelect要素が見つかりません');
                }
                
                break; // 成功したのでループ終了
              }
            } else {
              console.log(`    ❌ クリック後リストボックス未表示`);
            }
          } catch (clickError) {
            console.log(`    ❌ クリック失敗: ${clickError.message}`);
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ テストエラー: ${error.message}`);
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'e2e-tests/prescription-dom-investigation.png' });
    
    console.log('\n🎉 処方箋DOM調査テスト完了');
  });
});