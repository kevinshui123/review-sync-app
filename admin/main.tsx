import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/Login';
import AdminDashboard from './pages/Dashboard';
import UsersPage from './pages/Users';
import RealCommentsPage from './pages/RealComments';
import './styles/global.css';

function AdminApp() {
  const isAuthenticated = !!localStorage.getItem('admin_token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={
          isAuthenticated ? <Navigate to="/admin" replace /> : <AdminLogin />
        } />
        <Route path="/admin" element={
          isAuthenticated ? <AdminDashboard /> : <Navigate to="/admin/login" replace />
        } />
        <Route path="/admin/users" element={
          isAuthenticated ? <UsersPage /> : <Navigate to="/admin/login" replace />
        } />
        <Route path="/admin/users/:id" element={
          isAuthenticated ? <UsersPage /> : <Navigate to="/admin/login" replace />
        } />
        <Route path="/admin/real-comments" element={
          isAuthenticated ? <RealCommentsPage /> : <Navigate to="/admin/login" replace />
        } />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
