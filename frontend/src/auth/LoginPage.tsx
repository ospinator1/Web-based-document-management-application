import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const LoginPage: React.FC = () => {
  const { user, login, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '100vh' }}
      >
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh', background: '#f5f7fb' }}
    >
      <div className="card shadow-sm" style={{ width: 400 }}>
        <div className="card-body p-4 text-center">
          <h3 className="mb-1">ISPM</h3>
          <p className="text-muted mb-4" style={{ fontSize: 13 }}>
            Система управления политиками ИБ
          </p>
          <button className="btn btn-primary w-100" onClick={login}>
            Войти через Keycloak
          </button>
          <div className="text-muted small mt-3">
            Вы будете перенаправлены на страницу входа Keycloak
          </div>
        </div>
      </div>
    </div>
  );
};