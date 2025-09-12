/**
 * Enhanced Clinical Assistant API Client
 * リアルタイム診療支援・状況整理・A&P整合性チェック
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

// Create axios instance with auth
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class EnhancedClinicalAPI {
  constructor() {
    this.baseURL = '/enhanced-clinical';
  }

  /**
   * リアルタイム患者状況整理生成
   * @param {Object} clinicalData - 臨床データ
   * @returns {Promise<Object>} 患者状況整理結果
   */
  async generatePatientSummary(clinicalData) {
    try {
      const response = await api.post(`${this.baseURL}/generate-patient-summary`, clinicalData);
      return response.data;
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
      const response = await api.post(`${this.baseURL}/validate-clinical-reasoning`, validationData);
      return response.data;
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
      const response = await api.post(`${this.baseURL}/enhanced-pii-detection`, piiData);
      return response.data;
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
      const response = await api.post(`${this.baseURL}/clinical-recommendations`, { patient_data: patientData, diagnosis });
      return response.data;
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
      const response = await api.get(`${this.baseURL}/enhanced-clinical-status`);
      return response.data;
    } catch (error) {
      console.error('Service status error:', error);
      throw error;
    }
  }
}

// シングルトンインスタンスを作成
const enhancedClinicalAPI = new EnhancedClinicalAPI();

export default enhancedClinicalAPI;