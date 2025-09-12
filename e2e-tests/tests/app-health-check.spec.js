const { test, expect } = require('@playwright/test');

test.describe('Application Health Check', () => {
  test('should check if backend is running', async ({ page }) => {
    try {
      // APIドキュメントにアクセス
      const response = await page.goto('http://localhost:8000/docs', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      console.log('Backend response status:', response?.status());
      
      if (response && response.ok()) {
        console.log('✅ Backend is running on port 8000');
        await page.screenshot({ path: 'e2e-tests/backend-health-check.png' });
      } else {
        console.log('❌ Backend is not accessible');
      }
    } catch (error) {
      console.log('❌ Backend connection error:', error.message);
    }
  });

  test('should check if frontend is running', async ({ page }) => {
    try {
      // フロントエンドにアクセス
      const response = await page.goto('http://localhost:3000', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      console.log('Frontend response status:', response?.status());
      
      if (response && response.ok()) {
        console.log('✅ Frontend is running on port 3000');
        await page.screenshot({ path: 'e2e-tests/frontend-health-check.png' });
        
        // ページタイトルを確認
        const title = await page.title();
        console.log('Page title:', title);
      } else {
        console.log('❌ Frontend is not accessible');
      }
    } catch (error) {
      console.log('❌ Frontend connection error:', error.message);
    }
  });

  test('should start services if not running', async ({ page }) => {
    // バックエンドの確認
    let backendRunning = false;
    try {
      const backendResponse = await page.goto('http://localhost:8000/docs', { 
        waitUntil: 'domcontentloaded',
        timeout: 3000 
      });
      backendRunning = backendResponse && backendResponse.ok();
    } catch (error) {
      console.log('Backend not running, will start it');
    }

    // フロントエンドの確認
    let frontendRunning = false;
    try {
      const frontendResponse = await page.goto('http://localhost:3000', { 
        waitUntil: 'domcontentloaded',
        timeout: 3000 
      });
      frontendRunning = frontendResponse && frontendResponse.ok();
    } catch (error) {
      console.log('Frontend not running, will start it');
    }

    console.log('Service status:');
    console.log('- Backend:', backendRunning ? '✅ Running' : '❌ Not running');
    console.log('- Frontend:', frontendRunning ? '✅ Running' : '❌ Not running');
    
    if (!backendRunning || !frontendRunning) {
      console.log('\nServices need to be started manually:');
      if (!backendRunning) {
        console.log('\nTo start backend:');
        console.log('cd backend');
        console.log('source venv/bin/activate');
        console.log('export DATABASE_URL=postgresql://ehr_user@localhost:5432/ehr_mvp');
        console.log('export REDIS_URL=redis://localhost:6379/0');
        console.log('export SECRET_KEY=dev-secret-key-do-not-use-in-production');
        console.log('export CORS_ORIGINS=\'["http://localhost:3000", "http://localhost:8080"]\'');
        console.log('uvicorn app.main:app --reload --host 0.0.0.0 --port 8000');
      }
      if (!frontendRunning) {
        console.log('\nTo start frontend:');
        console.log('cd frontend');
        console.log('npm start');
      }
    }
  });
});