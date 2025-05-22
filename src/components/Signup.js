import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Signup.css';

export default function Signup() {
  const nameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { signup } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError('Las contraseñas no coinciden');
    }
    if (!nameRef.current.value) {
      return setError('Por favor ingresa tu nombre');
    }

    try {
      setError('');
      setLoading(true);
      await signup(emailRef.current.value, passwordRef.current.value, nameRef.current.value);
      // Redirigir a /gestion-cuentas en vez de /dashboard
      navigate('/gestion-cuentas');
    } catch (err) {
      console.error("Error en Signup:", err);
      let friendlyError = "Falló al crear la cuenta.";
      if (err.code === 'auth/email-already-in-use') {
        friendlyError = "Este correo electrónico ya está en uso.";
      } else if (err.code === 'auth/weak-password') {
        friendlyError = "La contraseña debe tener al menos 6 caracteres.";
      } else if (err.message) {
        friendlyError += ` (${err.message})`;
      }
      setError(friendlyError);
    }
    setLoading(false);
  }

  return (
    <div className="signup-container">
      <div className="login-brand">
        <div className="logo">F</div>
        <h1>Familion</h1>
      </div>
      
      <div className="signup-card">
        <h2>Crear Cuenta</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre</label>
            <input id="name" type="text" ref={nameRef} required />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input id="email" type="email" ref={emailRef} required />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" ref={passwordRef} required />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input id="confirmPassword" type="password" ref={passwordConfirmRef} required />
          </div>
          
          <button disabled={loading} className="primary-button" type="submit">
            {loading ? <span className="loading-spinner"></span> : 'Registrarse'}
          </button>
        </form>
        
        <div className="login-link">
          ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link>
        </div>
      </div>
    </div>
  );
}
