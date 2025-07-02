import axios from 'axios';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

// Create axios instance
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  testToken: () => api.post('/auth/test-token'),
};

// Patients API
export const patientsAPI = {
  getPatients: (params) => api.get('/patients/', { params }),
  getPatient: (id) => api.get(`/patients/${id}`),
  getPatientByPatientId: (patientId) => api.get(`/patients/by-patient-id/${patientId}`),
  createPatient: (patientData) => api.post('/patients/', patientData),
  updatePatient: (id, patientData) => api.put(`/patients/${id}`, patientData),
  deletePatient: (id) => api.delete(`/patients/${id}`),
  getPatientsCount: (params) => api.get('/patients/search/count', { params }),
};

// Encounters API
export const encountersAPI = {
  getEncounters: (params) => api.get('/encounters/', { params }),
  getEncounter: (id) => api.get(`/encounters/${id}`),
  getEncounterByEncounterId: (encounterId) => api.get(`/encounters/by-encounter-id/${encounterId}`),
  createEncounter: (encounterData) => api.post('/encounters/', encounterData),
  updateEncounter: (id, encounterData) => api.put(`/encounters/${id}`, encounterData),
  updateVitalSigns: (id, vitalSigns) => api.patch(`/encounters/${id}/vital-signs`, vitalSigns),
  updateSOAPNotes: (id, soapNotes) => api.patch(`/encounters/${id}/soap-notes`, soapNotes),
  getPatientEncounters: (patientId, params) => api.get(`/encounters/patient/${patientId}`, { params }),
  getPractitionerEncounters: (practitionerId, params) => api.get(`/encounters/practitioner/${practitionerId}`, { params }),
  getEncountersCount: (params) => api.get('/encounters/search/count', { params }),
};

// Medications API
export const medicationsAPI = {
  searchMedications: (params) => api.get('/medications/search', { params }),
  getMedications: (params) => api.get('/medications/', { params }),
  getMedication: (id) => api.get(`/medications/${id}`),
  getMedicationByCode: (code) => api.get(`/medications/code/${code}`),
  createMedication: (medicationData) => api.post('/medications/', medicationData),
  updateMedication: (id, medicationData) => api.put(`/medications/${id}`, medicationData),
  deleteMedication: (id) => api.delete(`/medications/${id}`),
  getMedicationForms: () => api.get('/medications/forms/list/'),
  getMedicationCategories: () => api.get('/medications/categories/list/'),
};

// Prescriptions API
export const prescriptionsAPI = {
  getPrescriptions: (params) => api.get('/prescriptions/', { params }),
  getPrescription: (id) => api.get(`/prescriptions/${id}`),
  createPrescription: (prescriptionData) => api.post('/prescriptions/', prescriptionData),
  updatePrescription: (id, prescriptionData) => api.put(`/prescriptions/${id}`, prescriptionData),
  dispensePrescription: (id, dispensingData) => api.post(`/prescriptions/${id}/dispense`, dispensingData),
  getPatientPrescriptionHistory: (patientId, params) => api.get(`/prescriptions/patient/${patientId}/history`, { params }),
  cancelPrescription: (id) => api.delete(`/prescriptions/${id}`),
};

// AI Assistant API
export const aiAssistantAPI = {
  checkSafety: (data) => api.post('/ai-assistant/safety-check', data),
  assistDiagnosis: (data) => api.post('/ai-assistant/diagnosis-assist', data),
  generateSummary: (data) => api.post('/ai-assistant/generate-summary', data),
  getStatus: () => api.get('/ai-assistant/safety-status'),
  getAuditLogs: (params) => api.get('/ai-assistant/audit-logs', { params }),
};

// Generic API error handler
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      status,
      message: data.detail || data.message || 'An error occurred',
      errors: data.errors || null,
    };
  } else if (error.request) {
    // Network error
    return {
      status: 0,
      message: 'Network error. Please check your connection.',
      errors: null,
    };
  } else {
    // Other error
    return {
      status: 0,
      message: error.message || 'An unexpected error occurred',
      errors: null,
    };
  }
};

export default api;