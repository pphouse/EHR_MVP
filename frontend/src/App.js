import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Encounters from './pages/Encounters';
import EncounterDetail from './pages/EncounterDetail';
import EncounterCreate from './pages/EncounterCreate';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/patients" 
        element={
          <ProtectedRoute>
            <Patients />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/patients/:id" 
        element={
          <ProtectedRoute>
            <PatientDetail />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/encounters" 
        element={
          <ProtectedRoute>
            <Encounters />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/encounters/create" 
        element={
          <ProtectedRoute>
            <EncounterCreate />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/encounters/:id" 
        element={
          <ProtectedRoute>
            <EncounterDetail />
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect */}
      <Route 
        path="/" 
        element={<Navigate to="/dashboard" replace />} 
      />
      
      {/* 404 fallback */}
      <Route 
        path="*" 
        element={<Navigate to="/dashboard" replace />} 
      />
    </Routes>
  );
}

export default App;