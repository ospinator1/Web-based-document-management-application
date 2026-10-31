import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div style={{ padding: '20px' }}>
      <h3>Профиль</h3>
      <Link to="/dashboard" style={{ marginBottom: '20px', display: 'inline-block' }}>Назад на главную</Link>
      
      <div style={{ lineHeight: '1.8' }}>
        <p><strong>Логин:</strong> {user.username}</p>
        <p><strong>Имя:</strong> {user.first_name} {user.last_name}</p>
        <p><strong>Роль:</strong> {user.role}</p>
        <p><strong>Отдел:</strong> {user.department || 'Не назначен'}</p>
      </div>

      <button onClick={logout} style={{ marginTop: '20px', padding: '5px 15px' }}>
        Выйти
      </button>
    </div>
  );
};