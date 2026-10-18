import React from 'react';
import { Link } from 'react-router-dom';

export const ForbiddenPage: React.FC = () => (
  <div className="container text-center mt-5">
    <h1 className="display-4">403</h1>
    <p className="lead">У вас нет доступа к этой странице.</p>
    <Link to="/dashboard" className="btn btn-primary">
      На главную
    </Link>
  </div>
);