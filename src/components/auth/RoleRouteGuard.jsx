import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RoleRouteGuard = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-container text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xl font-headline font-bold">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  // No user at all? To login.
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but role is NULL? If loading is finished, something is wrong. 
  // We'll give it a fallback role to avoid white screen.
  const activeRole = userRole || 'employee';

  // Logged in but role is not authorized for this route
  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    console.log(`Access denied for role: ${activeRole}. Redirecting to native dashboard.`);
    if (activeRole === 'admin') return <Navigate to="/admin" replace />;
    if (activeRole === 'branch_manager') return <Navigate to="/branch_manager" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;

  return children;
};

export default RoleRouteGuard;
