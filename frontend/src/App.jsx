import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Websites from './pages/Websites';
import ScanReport from './pages/ScanReport';
import Alerts from './pages/Alerts';
import AuditLogs from './pages/AuditLogs';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Secure Operator Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/websites"
            element={
              <ProtectedRoute>
                <Layout>
                  <Websites />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/scans/website/:websiteId"
            element={
              <ProtectedRoute>
                <Layout>
                  <ScanReport />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/scans/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ScanReport />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Layout>
                  <Alerts />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute>
                <Layout>
                  <AuditLogs />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
