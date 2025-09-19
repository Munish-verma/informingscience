import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import UserDashboard from './components/UserDashboard';
import ReviewerDashboard from './components/ReviewerDashboard';
import EditorDashboard from './components/EditorDashboard';
import EditorInChiefDashboard from './components/EditorInChiefDashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminLayout from './components/AdminLayout';
import UserManagement from './components/admin/UserManagement';
import JournalConferenceManagement from './components/admin/JournalConferenceManagement';
import ContentManagement from './components/admin/ContentManagement';
import EmailTemplateManagement from './components/admin/EmailTemplateManagement';
import SystemConfiguration from './components/admin/SystemConfiguration';
import AnalyticsReports from './components/admin/AnalyticsReports';
import DataBackupExport from './components/admin/DataBackupExport';
import Profile from './components/Profile';
import Publications from './components/Publications';
import Community from './components/Community';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // Default redirect based on user role
  const getDefaultRoute = () => {
    if (!user) return '/dashboard';

    // Check for admin roles first
    if (user.roles?.includes('super-admin') || user.roles?.includes('administrator')) {
      return '/admin-dashboard';
    }

    // Check for editorial roles
    if (user.roles?.includes('editor-in-chief')) {
      return '/editor-in-chief-dashboard';
    }

    if (user.roles?.includes('editor')) {
      return '/editor-dashboard';
    }

    // Check for reviewer role
    if (user.roles?.includes('reviewer') || user.isReviewer) {
      return '/reviewer-dashboard';
    }

    // Default to user dashboard for colleagues and members
    return '/dashboard';
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to={getDefaultRoute()} replace />
            ) : (
              <LoginPage />
            )
          } 
        />

        {/* Admin routes with AdminLayout (separate from main layout) */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute requiredRoles={['super-admin', 'administrator']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="journals" element={<JournalConferenceManagement />} />
          <Route path="content" element={<ContentManagement />} />
          <Route path="email-templates" element={<EmailTemplateManagement />} />
          <Route path="system-config" element={<SystemConfiguration />} />
          <Route path="analytics" element={<AnalyticsReports />} />
          <Route path="backup" element={<DataBackupExport />} />
        </Route>

        {/* Protected routes with main layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Default redirect */}
          <Route index element={<Navigate to={getDefaultRoute()} replace />} />
          
          {/* Dashboard routes */}
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="editor-in-chief-dashboard" element={
            <ProtectedRoute requiredRoles={['editor-in-chief']}>
              <EditorInChiefDashboard />
            </ProtectedRoute>
          } />
          <Route path="editor-dashboard" element={
            <ProtectedRoute requiredRoles={['editor']}>
              <EditorDashboard />
            </ProtectedRoute>
          } />
          <Route path="reviewer-dashboard" element={
            <ProtectedRoute requiredRoles={['reviewer']}>
              <ReviewerDashboard />
            </ProtectedRoute>
          } />
          
          {/* Common routes for all authenticated users */}
          <Route path="profile" element={<Profile />} />
          <Route path="publications" element={<Publications />} />
          <Route path="community" element={<Community />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;