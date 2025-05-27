// src/components/ThemeToggle.js
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    
    // Quitar la animación después de que termine
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  return (
    <button
      className={`theme-toggle ${theme}`}
      onClick={handleToggle}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span className={`theme-toggle-icon ${isAnimating ? 'rotating' : ''}`}>
        {isDark ? '🌙' : '☀️'}
      </span>
      <span className="theme-toggle-tooltip">
        {isDark ? 'Modo claro' : 'Modo oscuro'}
      </span>
    </button>
  );
};

export default ThemeToggle;
