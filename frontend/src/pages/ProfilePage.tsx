import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="container mt-4" style={{ maxWidth: 720 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Профиль пользователя</h3>
        <Link to="/dashboard" className="btn btn-outline-secondary btn-sm">
          ← На дашборд
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <dl className="row mb-0">
            <dt className="col-sm-4">Логин</dt>
            <dd className="col-sm-8">{user.username}</dd>

            <dt className="col-sm-4">Имя</dt>
            <dd className="col-sm-8">
              {user.first_name} {user.last_name}
            </dd>

            <dt className="col-sm-4">Email</dt>
            <dd className="col-sm-8">{user.email || '—'}</dd>

            <dt className="col-sm-4">Роль</dt>
            <dd className="col-sm-8">
              <span className="badge bg-primary">{user.role}</span>
            </dd>

            <dt className="col-sm-4">Отдел</dt>
            <dd className="col-sm-8">{user.department || '—'}</dd>

            <dt className="col-sm-4">Должность</dt>
            <dd className="col-sm-8">{user.position || '—'}</dd>

            <dt className="col-sm-4">Роли Keycloak</dt>
            <dd className="col-sm-8">
              {user.realmRoles.length ? (
                user.realmRoles.map((r) => (
                  <span key={r} className="badge bg-secondary me-1 mb-1">
                    {r}
                  </span>
                ))
              ) : (
                '—'
              )}
            </dd>
          </dl>
        </div>
      </div>

      <button className="btn btn-outline-danger mt-3" onClick={logout}>
        Выйти
      </button>
    </div>
  );
};