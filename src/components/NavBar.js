import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './NavBar.css';

const NavBar = () => {
  const { currentUser, logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Familion</h1>
      </div>
      
      <div className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          Panel Principal
        </NavLink>
        <NavLink to="/gestion-cuentas" className={({ isActive }) => isActive ? 'active' : ''}>
          Gestionar Cuentas
        </NavLink>
      </div>
      
      <div className="navbar-user">
        <span className="user-name">{currentUser?.displayName || currentUser?.email}</span>
        <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
      </div>
    </nav>
  );
};

export default NavBar;
