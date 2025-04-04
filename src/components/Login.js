import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('familion_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await login(email, password);

      if (rememberMe) {
        localStorage.setItem('familion_email', email);
      } else {
        localStorage.removeItem('familion_email');
      }

      navigate('/dashboard');
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Por favor, inténtalo más tarde';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!resetEmail.trim()) {
      return setError('Por favor, ingresa tu correo electrónico');
    }

    try {
      setLoading(true);
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (error) {
      let errorMessage = 'Error al enviar el correo de recuperación';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (resetPasswordMode) {
    return (
      <div className="login-container">
        <div className="login-brand">
          <div className="logo">F</div>
          <h1>Familion</h1>
        </div>

        <div className="login-card">
          <h2>{resetSuccess ? 'Correo Enviado' : 'Recuperar Contraseña'}</h2>

          {resetSuccess ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <p>Hemos enviado un correo electrónico con instrucciones para restablecer tu contraseña.</p>
              <button
                className="primary-button back-button"
                onClick={() => {
                  setResetPasswordMode(false);
                  setResetSuccess(false);
                }}
              >
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <>
              {error && <div className="alert alert-danger">{error}</div>}
              <p className="instructions">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>

              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label htmlFor="resetEmail">Correo Electrónico</label>
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="nombre@ejemplo.com"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setResetPasswordMode(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar Enlace'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

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
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              required
            />
          </div>

          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">Recordarme</label>
            </div>

            <button
              type="button"
              className="forgot-password"
              onClick={() => {
                setResetPasswordMode(true);
                setResetEmail(email);
              }}
            >
              Olvidé mi contraseña
            </button>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="signup-link">
          ¿No tienes una cuenta? <Link to="/signup">Regístrate</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
