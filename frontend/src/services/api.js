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
  getPatients: (params) => api.get('/patients', { params }),
  getPatient: (id) => api.get(`/patients/${id}`),
  getPatientByPatientId: (patientId) => api.get(`/patients/by-patient-id/${patientId}`),
  createPatient: (patientData) => api.post('/patients', patientData),
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