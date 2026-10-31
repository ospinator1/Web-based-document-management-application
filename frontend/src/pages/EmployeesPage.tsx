import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

interface Employee {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  department_name: string;
}

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data } = await api.get('/users/');
        setEmployees(data);
      } catch (err: any) {
        setError(err.response?.status === 403 ? 'Нет прав или не передан токен' : 'Ошибка загрузки');
      }
    };
    fetchEmployees();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h3>Сотрудники</h3>
      <Link to="/dashboard">Назад</Link>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table border={1} cellPadding={8} style={{ marginTop: '20px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ФИО</th>
            <th>Логин</th>
            <th>Отдел</th>
            <th>Роль</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.last_name} {emp.first_name}</td>
              <td>{emp.username}</td>
              <td>{emp.department_name || '—'}</td>
              <td>{emp.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};