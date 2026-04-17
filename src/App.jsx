import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import BookingForm from './pages/BookingForm';
import './index.css';

import BranchManagerDashboard from './pages/BranchManagerDashboard';
import { AuthProvider } from './contexts/AuthContext';
import RoleRouteGuard from './components/auth/RoleRouteGuard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={
              <RoleRouteGuard allowedRoles={['employee', 'secretary']}>
                <UserDashboard />
              </RoleRouteGuard>
            } />
            <Route path="/admin" element={
              <RoleRouteGuard allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleRouteGuard>
            } />
            <Route path="/branch_manager" element={
              <RoleRouteGuard allowedRoles={['branch_manager']}>
                <BranchManagerDashboard />
              </RoleRouteGuard>
            } />
            <Route path="/booking" element={
              <RoleRouteGuard allowedRoles={['employee', 'secretary', 'admin', 'branch_manager']}>
                <BookingForm />
              </RoleRouteGuard>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
