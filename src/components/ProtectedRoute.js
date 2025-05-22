import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!currentUser) {
    // Redirige a login y recuerda la ruta original para volver después de loguear
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !currentUser.isAdmin) {
    console.warn('[ProtectedRoute] Acceso denegado a ruta admin para usuario no admin.');
    // Redirigir a /gestion-cuentas en vez de /dashboard
    return <Navigate to="/gestion-cuentas" replace />;
  }

  return children;
};

export default ProtectedRoute;
