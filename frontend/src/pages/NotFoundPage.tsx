import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => (
  <div className="container text-center mt-5">
    <h1 className="display-4">404</h1>
    <p className="lead">Страница не найдена.</p>
    <Link to="/dashboard" className="btn btn-primary">
      На главную
    </Link>
  </div>
);