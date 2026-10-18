import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="container mt-4">
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">ISPM</span>
          <div className="d-flex align-items-center">
            <Link to="/dashboard" className="btn btn-outline-secondary btn-sm me-2">
              Дашборд
            </Link>
            <Link to="/profile" className="btn btn-outline-secondary btn-sm me-2">
              Профиль
            </Link>
            {['ADMIN', 'DIRECTOR'].includes(user.role) ? (
              <Link to="/director" className="btn btn-outline-secondary btn-sm me-2">
                Директор
              </Link>
            ) : null}
            {['ADMIN', 'DIRECTOR', 'DEPARTMENT_HEAD'].includes(user.role) ? (
              <Link to="/department" className="btn btn-outline-secondary btn-sm me-2">
                Отдел
              </Link>
            ) : null}
            <span className="me-3 text-muted small">
              {user.first_name} {user.last_name} ({user.role})
            </span>
            <button className="btn btn-outline-danger btn-sm" onClick={logout}>
              Выйти
            </button>
          </div>
        </div>
      </nav>

      <h3 className="mb-3">Дашборд</h3>

      <div className="row g-3">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Добро пожаловать!</h5>
              <p className="card-text mb-1">
                Вы вошли как <strong>{user.username}</strong>
              </p>
              <p className="card-text">
                Роль: <span className="badge bg-primary">{user.role}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Роли Keycloak</h5>
              {user.realmRoles.length ? (
                <div>
                  {user.realmRoles.map((r) => (
                    <span key={r} className="badge bg-secondary me-1 mb-1">
                      {r}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted mb-0">Нет ролей</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Профиль</h5>
              <p className="mb-1">
                <strong>Email:</strong> {user.email || '—'}
              </p>
              <p className="mb-0">
                <strong>Отдел:</strong> {user.department || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};