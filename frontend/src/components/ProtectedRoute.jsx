import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cyber-bg">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-cyber-border"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-cyber-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
