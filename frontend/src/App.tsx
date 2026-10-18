import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['DIRECTOR', 'ADMIN']} />}>
          <Route
            path="/director"
            element={
              <div className="container mt-4">
                <h3>Панель директора</h3>
                <p>Доступно только роли DIRECTOR и ADMIN.</p>
              </div>
            }
          />
        </Route>

        <Route
          element={<ProtectedRoute roles={['DEPARTMENT_HEAD', 'DIRECTOR', 'ADMIN']} />}
        >
          <Route
            path="/department"
            element={
              <div className="container mt-4">
                <h3>Панель отдела</h3>
                <p>Доступно роли DEPARTMENT_HEAD и выше.</p>
              </div>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;