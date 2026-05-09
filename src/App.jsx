import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { AuthProvider } from './contexts/AuthContext';
import { PopupProvider } from './contexts/PopupContext';
import RoleRouteGuard from './components/auth/RoleRouteGuard';

function App() {
  return (
    <AuthProvider>
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
                <RoleRouteGuard allowedRoles={['admin', 'temp_admin']}>
                  <AdminRequests />
                </RoleRouteGuard>
              } />
              <Route path="/admin/rooms" element={
                <RoleRouteGuard allowedRoles={['admin', 'temp_admin']}>
                  <RoomManagement />
                </RoleRouteGuard>
              } />
              <Route path="/admin/rooms/search" element={
                <RoleRouteGuard allowedRoles={['admin', 'temp_admin']}>
                  <AdvancedRoomSearch />
                </RoleRouteGuard>
              } />
              <Route path="/admin/statistics" element={
                <RoleRouteGuard allowedRoles={['admin', 'temp_admin', 'branch_manager']}>
                  <AdminStatistics />
                </RoleRouteGuard>
              } />
              <Route path="/admin/delegation" element={
                <RoleRouteGuard allowedRoles={['admin']}>
                  <AdminDelegation />
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
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PopupProvider>
    </AuthProvider>
  );
}

export default App;
