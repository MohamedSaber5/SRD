import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from './components/layout/DashboardLayout';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminRequests from './pages/AdminRequests';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import BookingForm from './pages/BookingForm';
import NotificationsPage from './pages/NotificationsPage';
import RoomManagement from './pages/RoomManagement';
import AdvancedRoomSearch from './pages/AdvancedRoomSearch';
import './index.css';

import BranchManagerDashboard from './pages/BranchManagerDashboard';
import AdminStatistics from './pages/AdminStatistics';
import AdminDelegation from './pages/AdminDelegation';
import BranchManagerLogs from './pages/BranchManagerLogs';
import UserSettings from './pages/UserSettings';
import AdminSettings from './pages/AdminSettings';
import { AuthProvider } from './contexts/AuthContext';
import { PopupProvider } from './contexts/PopupContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { RamadanProvider } from './contexts/RamadanContext';
import RoleRouteGuard from './components/auth/RoleRouteGuard';
import RamadanOverlay from './components/ui/RamadanOverlay';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <AuthProvider>
      <ThemeProvider>
        <RamadanProvider>
        <PopupProvider>
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
                <RoleRouteGuard allowedRoles={['admin', 'temp_admin']}>
                  <AdminDashboard />
                </RoleRouteGuard>
              } />
              <Route path="/admin/requests" element={
                <RoleRouteGuard allowedRoles={['admin', 'temp_admin']} requiredPermission="requests">
                  <AdminRequests />
                </RoleRouteGuard>
              } />
              <Route path="/admin/rooms" element={
                <RoleRouteGuard allowedRoles={['admin', 'temp_admin']} requiredPermission="rooms">
                  <RoomManagement />
                </RoleRouteGuard>
              } />
              <Route path="/admin/rooms/search" element={
                <RoleRouteGuard allowedRoles={['admin', 'temp_admin']} requiredPermission="rooms">
                  <AdvancedRoomSearch />
                </RoleRouteGuard>
              } />
              <Route path="/admin/statistics" element={
                <RoleRouteGuard allowedRoles={['admin', 'temp_admin', 'branch_manager']} requiredPermission="statistics">
                  <AdminStatistics />
                </RoleRouteGuard>
              } />
              <Route path="/admin/delegation" element={
                <RoleRouteGuard allowedRoles={['admin']}>
                  <AdminDelegation />
                </RoleRouteGuard>
              } />
              <Route path="/admin/settings" element={
                <RoleRouteGuard allowedRoles={['admin', 'temp_admin']} requiredPermission="settings">
                  <AdminSettings />
                </RoleRouteGuard>
              } />
              <Route path="/branch_manager" element={
                <RoleRouteGuard allowedRoles={['branch_manager']}>
                  <BranchManagerDashboard />
                </RoleRouteGuard>
              } />
              <Route path="/branch_manager/logs" element={
                <RoleRouteGuard allowedRoles={['branch_manager']}>
                  <BranchManagerLogs />
                </RoleRouteGuard>
              } />
              <Route path="/booking" element={
                <RoleRouteGuard allowedRoles={['employee', 'secretary', 'admin', 'branch_manager', 'temp_admin']}>
                  <BookingForm />
                </RoleRouteGuard>
              } />
              <Route path="/settings" element={
                <RoleRouteGuard allowedRoles={['employee', 'secretary', 'admin', 'branch_manager', 'temp_admin']}>
                  <UserSettings />
                </RoleRouteGuard>
              } />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Routes>
          <RamadanOverlay />
        </BrowserRouter>
        </PopupProvider>
        </RamadanProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
