import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AgentRoute = ({ children }) => {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/agent/login" state={{ from: location }} replace />;
  }

  if (role !== 'delivery') {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AgentRoute;
