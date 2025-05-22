import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Si ya hay token, redirigir automáticamente a cuentas
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      navigate('/gestion-cuentas');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        throw new Error('Usuario o contraseña incorrectos');
      }
      const data = await response.json();
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      navigate('/gestion-cuentas');
    } catch (err) {
      setError('Usuario o contraseña incorrectos. Si tienes problemas, contacta al administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-brand">
        <div className="logo">F</div>
        <h1>Familion</h1>
      </div>
      <div className="login-card">
        <h2>Iniciar Sesión</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Usuario"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? <span className="loading-spinner"></span> : 'Entrar'}
          </button>
        </form>
        <div className="signup-link">
          ¿Problemas para acceder? Contacta al administrador.
        </div>
      </div>
    </div>
  );
};

export default Login;
