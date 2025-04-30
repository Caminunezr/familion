import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './NavBar.css';

const NavBar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Estado para menú móvil
  const navRef = useRef(null); // Ref para detectar clics fuera

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Sincronizar isAdmin con currentUser.isAdmin
  useEffect(() => {
    if (currentUser && currentUser.isAdmin) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [currentUser]);

  // Función para alternar el menú móvil
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Función para cerrar el menú al hacer clic en un enlace
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Efecto para cerrar el menú si se hace clic fuera (opcional pero recomendado)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navRef]);

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-container">
        <div className="nav-brand">
          <span className="logo">F</span>
          <h1>Familion</h1>
        </div>

        {/* Botón Hamburguesa - visible solo en móvil */}
        <button className="mobile-menu-button" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? '✕' : '☰'} {/* Icono cambia */}
        </button>

        {/* Enlaces de Navegación - Ocultos en móvil por defecto, mostrados en escritorio */}
        <div className={`nav-links ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
          <NavLink to="/dashboard" className="nav-link" onClick={handleLinkClick}>Dashboard</NavLink>
          <NavLink to="/gestion-cuentas" className="nav-link" onClick={handleLinkClick}>Cuentas</NavLink>
          <NavLink to="/presupuesto" className="nav-link" onClick={handleLinkClick}>Presupuesto</NavLink>
          <NavLink to="/historial" className="nav-link" onClick={handleLinkClick}>Historial</NavLink>
          {isAdmin && <NavLink to="/admin" className="nav-link" onClick={handleLinkClick}>Admin</NavLink>}
        </div>

        {currentUser && (
          <div className="user-info">
            <span>{currentUser.displayName || currentUser.email}</span>
            <button onClick={handleLogout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
