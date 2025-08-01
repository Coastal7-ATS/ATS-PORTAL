import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RealTimeProvider } from './contexts/RealTimeContext'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminJobs from './pages/admin/Jobs'
import AdminAddJob from './pages/admin/AddJob'
import AdminUsers from './pages/admin/Users'
import AdminCandidates from './pages/admin/Candidates'
import HRDashboard from './pages/hr/Dashboard'
import HRJobs from './pages/hr/Jobs'
import HRCandidates from './pages/hr/Candidates'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RealTimeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="add-job" element={<AdminAddJob />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="candidates" element={<AdminCandidates />} />
            </Route>
            
            {/* HR Routes */}
            <Route path="/hr" element={
              <ProtectedRoute allowedRoles={['hr']}>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/hr/dashboard" replace />} />
              <Route path="dashboard" element={<HRDashboard />} />
              <Route path="jobs" element={<HRJobs />} />
              <Route path="candidates" element={<HRCandidates />} />
            </Route>
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </RealTimeProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App 