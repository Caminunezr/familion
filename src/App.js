import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Signup from './components/Signup';
// Actualizar la ruta de importación para Dashboard
import Dashboard from './components/dashboard/Dashboard';
// Actualizar la ruta de importación para GestionCuentas
import GestionCuentas from './components/gestion-cuentas/GestionCuentas';
// Cambiar la importación de Presupuesto
import Presupuesto from './components/presupuesto/Presupuesto';
import Historial from './components/historial/Historial';
import { migrarCategoriasAntiguas } from './utils/dataMigration';
import { limpiarCategorias } from './utils/cleanCategories';
import './App.css';

function App() {
  useEffect(() => {
    // Ejecutar migración de categorías antiguas al iniciar la app y limpiar categorías
    const inicializarDatos = async () => {
      try {
        await migrarCategoriasAntiguas();
        // Añadir limpieza de categorías para asegurar que solo existan las nuevas
        await limpiarCategorias();
      } catch (error) {
        console.error("Error en inicialización de datos:", error);
      }
    };
    
    inicializarDatos();
  }, []);
  
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/gestion-cuentas" element={<ProtectedRoute><GestionCuentas /></ProtectedRoute>} />
            <Route path="/presupuesto" element={<ProtectedRoute><Presupuesto /></ProtectedRoute>} />
            
            <Route path="/historial" element={<ProtectedRoute><Historial /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
