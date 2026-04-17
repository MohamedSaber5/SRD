import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RoleRouteGuard = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-primary">
        <div className="text-xl font-headline animate-pulse">جاري التحميل...</div>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but waiting for role data
  if (currentUser && userRole === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-primary">
        <div className="text-xl font-headline animate-pulse">جاري جلب الصلاحيات...</div>
      </div>
    );
  }

  // Logged in but role is not authorized for this route
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'branch_manager') return <Navigate to="/branch_manager" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleRouteGuard;
