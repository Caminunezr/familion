import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Login from './login/login';
import Signup from './components/Signup';
import Dashboard from './components/dashboard/Dashboard';
import GestionCuentas from './components/gestion-cuentas/GestionCuentas';
import Presupuesto from './components/presupuesto/Presupuesto';
import Historial from './components/historial/Historial';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPage from './components/admin/AdminPage'; // Importar AdminPage
import Admin from './components/Admin'; // Importar el componente Admin
import './App.css';

function App() {
  const { loading } = useAuth();
  if (loading) {
    return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',fontSize:22,color:'#1976d2'}}>Cargando autenticación...</div>;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Rutas Protegidas */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/gestion-cuentas" element={<ProtectedRoute><GestionCuentas /></ProtectedRoute>} />
            <Route path="/presupuesto" element={<ProtectedRoute><Presupuesto /></ProtectedRoute>} />
            <Route path="/historial" element={<ProtectedRoute><Historial /></ProtectedRoute>} />
            {/* Nueva Ruta de Administración */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}> {/* Asegúrate que ProtectedRoute soporte requireAdmin */}
                <Admin />
              </ProtectedRoute>
            } />

            {/* Ruta por defecto o Not Found (opcional) */}
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
