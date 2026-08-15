import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EnrollmentPage from './pages/student/EnrollmentPage';
import ExamListPage from './pages/student/ExamListPage';
import ExamPage from './pages/student/ExamPage';
import SessionsPage from './pages/student/SessionsPage';
import DashboardPage from './pages/instructor/DashboardPage';
import ExamManagePage from './pages/instructor/ExamManagePage';
import SessionDetailPage from './pages/instructor/SessionDetailPage';
import SettingsPage from './pages/instructor/SettingsPage';
import './index.css';

function AppRoutes() {
  const { isAuthenticated, isInstructor } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <>
      {isAuthenticated && !isLandingPage && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={isAuthenticated ? (
          <Navigate to={isInstructor ? '/dashboard' : '/student/exams'} replace />
        ) : (
          <LoginPage />
        )} />
        <Route path="/register" element={isAuthenticated ? (
          <Navigate to={isInstructor ? '/dashboard' : '/student/exams'} replace />
        ) : (
          <RegisterPage />
        )} />

        {/* Student */}
        <Route path="/student/enrollment" element={
          <ProtectedRoute requiredRole="student"><EnrollmentPage /></ProtectedRoute>
        } />
        <Route path="/student/exams" element={
          <ProtectedRoute requiredRole="student"><ExamListPage /></ProtectedRoute>
        } />
        <Route path="/student/exam/:examId" element={
          <ProtectedRoute requiredRole="student"><ExamPage /></ProtectedRoute>
        } />
        <Route path="/student/sessions" element={
          <ProtectedRoute requiredRole="student"><SessionsPage /></ProtectedRoute>
        } />

        {/* Instructor */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="instructor"><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/exams" element={
          <ProtectedRoute requiredRole="instructor"><ExamManagePage /></ProtectedRoute>
        } />
        <Route path="/dashboard/sessions/:sessionId" element={
          <ProtectedRoute requiredRole="instructor"><SessionDetailPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/settings" element={
          <ProtectedRoute requiredRole="instructor"><SettingsPage /></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
