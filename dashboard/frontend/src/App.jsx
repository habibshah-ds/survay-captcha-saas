// frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/marketing/LandingPage";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import DashboardPage from "./components/dashboard/DashboardPage";
import AnalyticsPage from "./components/dashboard/AnalyticsPage";
import QuestionEditor from "./components/dashboard/QuestionEditor";
import AdminPanel from "./components/admin/AdminPanel";
import AuditLogsPage from "./components/admin/AuditLogsPage";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import AdminRoute from "./components/shared/AdminRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route index element={<DashboardPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="questions" element={<Navigate to="/dashboard/questions/list" replace />} />
                  <Route path="questions/list" element={<QuestionEditor />} />
                  <Route path="questions/new" element={<QuestionEditor />} />
                  <Route path="questions/:id/edit" element={<QuestionEditor />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <Routes>
                  <Route index element={<AdminPanel />} />
                  <Route path="audit-logs" element={<AuditLogsPage />} />
                </Routes>
              </AdminRoute>
            }
          />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
