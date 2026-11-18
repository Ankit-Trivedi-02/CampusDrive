import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import { Login } from './pages/Login';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CompanyManagement } from './pages/admin/CompanyManagement';
import { CoordinatorManagement } from './pages/admin/CoordinatorManagement';
import { HrManagement } from './pages/admin/HrManagement';
import { StudentManagement } from './pages/admin/StudentManagement';
import { ApplicationManagement } from './pages/admin/ApplicationManagement';

// Coordinator Pages
import { CoordinatorDashboard } from './pages/coordinator/CoordinatorDashboard';
import { CoordinatorStudents } from './pages/coordinator/CoordinatorStudents';
import { MakeApplication } from './pages/coordinator/MakeApplication';
import { CoordinatorApplications } from './pages/coordinator/CoordinatorApplications';

// HR Pages
import { HrDashboard } from './pages/hr/HrDashboard';
import { HrApplicants } from './pages/hr/HrApplicants';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentApplications } from './pages/student/StudentApplications';
import { UpcomingCompanies } from './pages/student/UpcomingCompanies';

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    case 'COORDINATOR':
      return <Navigate to="/coordinator/dashboard" replace />;
    case 'HR':
      return <Navigate to="/hr/dashboard" replace />;
    case 'STUDENT':
      return <Navigate to="/student/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Dashboard Routes */}
            <Route element={<DashboardLayout />}>
              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* ADMIN ROUTES */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/companies"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <CompanyManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/coordinators"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <CoordinatorManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/hr-accounts"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <HrManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <StudentManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/applications"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <ApplicationManagement />
                  </ProtectedRoute>
                }
              />

              {/* COORDINATOR ROUTES */}
              <Route
                path="/coordinator/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMIN']}>
                    <CoordinatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coordinator/students"
                element={
                  <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMIN']}>
                    <CoordinatorStudents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coordinator/make-application"
                element={
                  <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMIN']}>
                    <MakeApplication />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coordinator/applications"
                element={
                  <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMIN']}>
                    <CoordinatorApplications />
                  </ProtectedRoute>
                }
              />

              {/* HR / COMPANY ROUTES */}
              <Route
                path="/hr/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                    <HrDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/applicants"
                element={
                  <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                    <HrApplicants />
                  </ProtectedRoute>
                }
              />

              {/* STUDENT ROUTES */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/applications"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentApplications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/upcoming-companies"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <UpcomingCompanies />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
