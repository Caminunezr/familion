import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './NavBar.css';

const COLOR_PALETTE = [
  '#4caf50', '#2196f3', '#ff9800', '#f44336', '#607d8b', '#ba68c8', '#ffd600', '#00bcd4', '#e91e63', '#795548', '#8bc34a', '#009688', '#ff5722', '#3f51b5', '#cddc39', '#9c27b0'
];

const ProfileModal = ({ currentColor, onSave, onClose }) => {
  const [color, setColor] = useState(currentColor || '#607d8b');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const token = localStorage.getItem('access');
      const res = await fetch('http://localhost:8000/api/profile/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ color }),
      });
      if (!res.ok) throw new Error('Error al guardar el color');
      onSave(color);
    } catch (e) {
      setError('No se pudo guardar el color');
    }
    setSaving(false);
  };

  return (
    <div className="presupuesto-modal-bg responsive-modal-bg" style={{display:'flex',zIndex:2000}}>
      <div className="presupuesto-modal responsive-modal" style={{minWidth:320}}>
        <button className="presupuesto-modal-close" onClick={onClose}>×</button>
        <h3>Editar Perfil</h3>
        <div style={{marginBottom:16}}>
          <div style={{marginBottom:8,fontWeight:500}}>Color de usuario:</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
            {COLOR_PALETTE.map(c => (
              <button key={c} onClick={()=>setColor(c)} style={{
                width:32, height:32, borderRadius:'50%', border: color===c?'3px solid #1976d2':'2px solid #eee', background:c, cursor:'pointer', outline:'none', boxShadow: color===c?'0 0 0 2px #1976d2':'none', transition:'box-shadow 0.2s'}} aria-label={`Elegir color ${c}`}></button>
            ))}
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} style={{width:'100%',background:'#4caf50',color:'#fff',padding:10,border:'none',borderRadius:6,marginTop:10}}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        {error && <div className="presupuesto-feedback-error">{error}</div>}
      </div>
    </div>
  );
};

const NavBar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Estado para menú móvil
  const navRef = useRef(null); // Ref para detectar clics fuera
  const [showProfile, setShowProfile] = useState(false);
  const [userColor, setUserColor] = useState(currentUser?.color || '#607d8b');

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
            <button
              className="user-name-badge"
              style={{
                background: userColor,
                color: 'white',
                border: 'none',
                borderRadius: '18px',
                padding: '6px 16px',
                fontWeight: 600,
                fontSize: '1rem',
                marginRight: 10,
                boxShadow: '0 2px 6px rgba(25,118,210,0.10)',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              onClick={()=>setShowProfile(true)}
              title="Editar perfil"
            >
              <span style={{fontSize:'1.1em',marginRight:4}}>👤</span>
              {currentUser.username || currentUser.displayName || currentUser.email}
            </button>
            <button onClick={handleLogout} className="logout-button">
              Cerrar Sesión
            </button>
            {showProfile && (
              <ProfileModal
                currentColor={userColor}
                onSave={color => { setUserColor(color); setShowProfile(false); window.location.reload(); }}
                onClose={()=>setShowProfile(false)}
              />
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
