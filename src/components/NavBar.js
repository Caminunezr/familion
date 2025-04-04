import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './NavBar.css';

const NavBar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Familion</h1>
        <button className="menu-toggle" onClick={toggleMenu}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
      
      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => isActive ? 'active' : ''}
          onClick={closeMenu}
        >
          Panel Principal
        </NavLink>
        <NavLink 
          to="/gestion-cuentas" 
          className={({ isActive }) => isActive ? 'active' : ''}
          onClick={closeMenu}
        >
          Gestionar Cuentas
        </NavLink>
        <NavLink 
          to="/presupuesto" 
          className={({ isActive }) => isActive ? 'active' : ''}
          onClick={closeMenu}
        >
          Presupuesto
        </NavLink>
        <NavLink 
          to="/historial" 
          className={({ isActive }) => isActive ? 'active' : ''}
          onClick={closeMenu}
        >
          Historial
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
