import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <h2>Главная</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link to="/profile">Мой профиль</Link>
          
          {/* Кнопка Сотрудники только для Директора и Глав отделов */}
          {['DIRECTOR', 'DEPARTMENT_HEAD'].includes(user.role) && (
            <Link to="/employees">Сотрудники</Link>
          )}
          
          <button onClick={logout} style={{ color: 'red', cursor: 'pointer' }}>Выйти</button>
        </div>
      </div>

      <div>
        <h3>Добро пожаловать!</h3>
        <p><strong>ФИО:</strong> {user.first_name} {user.last_name}</p>
        <p><strong>Логин:</strong> {user.username}</p>
        <p><strong>Роль:</strong> {user.role}</p>
        <p><strong>Отдел:</strong> {user.department || 'Не назначен'}</p>
      </div>
    </div>
  );
};