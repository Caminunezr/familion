// src/contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  // Obtener el tema inicial del localStorage o usar 'light' por defecto
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Si no hay tema guardado, usar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Función para alternar entre modo claro y oscuro
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Función para establecer un tema específico
  const setThemeMode = (mode) => {
    setTheme(mode);
    localStorage.setItem('theme', mode);
  };

  // Aplicar el tema al body del documento
  useEffect(() => {
    const root = document.documentElement;
    
    // Remover clases de tema anteriores
    root.classList.remove('light-theme', 'dark-theme');
    
    // Agregar la clase del tema actual
    root.classList.add(`${theme}-theme`);
    
    // También agregar atributo data-theme para facilitar el CSS
    root.setAttribute('data-theme', theme);
    
    // Actualizar meta theme-color para PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#4caf50');
    }
  }, [theme]);

  // Escuchar cambios en la preferencia del sistema (opcional)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Solo cambiar automáticamente si no hay tema guardado en localStorage
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value = {
    theme,
    toggleTheme,
    setThemeMode,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
