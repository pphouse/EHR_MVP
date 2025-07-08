/**
 * Enhanced Clinical Assistant API Client
 * リアルタイム診療支援・状況整理・A&P整合性チェック
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

class EnhancedClinicalAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/v1/enhanced-clinical`;
  }

  /**
   * 認証ヘッダーを取得
   */
  getAuthHeaders() {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * リアルタイム患者状況整理生成
   * @param {Object} clinicalData - 臨床データ
   * @returns {Promise<Object>} 患者状況整理結果
   */
  async generatePatientSummary(clinicalData) {
    try {
      const response = await fetch(`${this.baseURL}/generate-patient-summary`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(clinicalData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Patient summary generation error:', error);
      throw error;
    }
  }

  /**
   * A&P整合性チェック
   * @param {Object} validationData - 検証データ
   * @returns {Promise<Object>} 整合性チェック結果
   */
  async validateClinicalReasoning(validationData) {
    try {
      const response = await fetch(`${this.baseURL}/validate-clinical-reasoning`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(validationData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Clinical validation error:', error);
      throw error;
    }
  }

  /**
   * Enhanced PII検知・マスキング
   * @param {Object} piiData - PII検知データ
   * @returns {Promise<Object>} PII検知結果
   */
  async detectPII(piiData) {
    try {
      const response = await fetch(`${this.baseURL}/enhanced-pii-detection`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(piiData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Enhanced PII detection error:', error);
      throw error;
    }
  }

  /**
   * 診断に基づく臨床推奨事項生成
   * @param {Object} patientData - 患者データ
   * @param {string} diagnosis - 診断
   * @returns {Promise<Object>} 推奨事項
   */
  async generateClinicalRecommendations(patientData, diagnosis) {
    try {
      const response = await fetch(`${this.baseURL}/clinical-recommendations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ patient_data: patientData, diagnosis })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Clinical recommendations error:', error);
      throw error;
    }
  }

  /**
   * Enhanced Clinical Assistant サービス状態確認
   * @returns {Promise<Object>} サービス状態
   */
  async getServiceStatus() {
    try {
      const response = await fetch(`${this.baseURL}/enhanced-clinical-status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Service status error:', error);
      throw error;
    }
  }
}

// シングルトンインスタンスを作成
const enhancedClinicalAPI = new EnhancedClinicalAPI();

export default enhancedClinicalAPI;