import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/common/Loader';
import AccessDeniedPage from '../pages/public/AccessDeniedPage';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen text="Verifying Amazon Cognito session and token claims..." />;
  }

  // Not authenticated -> redirect to login preserving intended target
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check based on verified Cognito claims
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const required = allowedRoles.includes('faculty') ? 'FACULTY' : 'STUDENT';
    return <AccessDeniedPage requiredRole={required} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
