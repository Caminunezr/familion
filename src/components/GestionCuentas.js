import React, { useState, useEffect } from 'react';
import NavBar from './NavBar';
import CuentaForm from './CuentaForm';
import db from '../utils/database';
import { useAuth } from '../contexts/AuthContext';
import './GestionCuentas.css';

const GestionCuentas = () => {
  const { currentUser } = useAuth();
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCuenta, setEditingCuenta] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchCuentas = async () => {
      try {
        setLoading(true);
        // Obtener todas las cuentas
        const cuentasArray = await db.cuentas.toArray();
        
        // Ordenar por fecha de creación (más recientes primero)
        cuentasArray.sort((a, b) => 
          new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
        );
        
        setCuentas(cuentasArray);
      } catch (error) {
        console.error('Error al cargar cuentas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCuentas();
  }, [refreshKey]);

  const handleCuentaSuccess = () => {
    setEditingCuenta(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteCuenta = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta cuenta?')) {
      try {
        // Eliminar primero los pagos asociados a esta cuenta
        await db.pagos.where('cuentaId').equals(id).delete();
        
        // Eliminar la cuenta
        await db.cuentas.delete(id);
        
        // Refrescar la lista
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error al eliminar la cuenta:', error);
        alert('Ocurrió un error al eliminar la cuenta');
      }
    }
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES');
  };

  return (
    <div className="gestion-page">
      <NavBar />
      
      <div className="gestion-container">
        <div className="gestion-header">
          <h2>Gestión de Cuentas</h2>
        </div>
        
        <div className="gestion-content">
          <div className="gestion-grid">
            <div className="form-section">
              <h3>{editingCuenta ? 'Editar Cuenta' : 'Crear Nueva Cuenta'}</h3>
              <CuentaForm 
                cuentaToEdit={editingCuenta}
                onSuccess={handleCuentaSuccess}
                onCancel={editingCuenta ? () => setEditingCuenta(null) : undefined}
              />
            </div>
            
            <div className="list-section">
              <h3>Listado de Cuentas</h3>
              {loading ? (
                <div className="loading-message">Cargando cuentas...</div>
              ) : cuentas.length === 0 ? (
                <div className="empty-message">No hay cuentas registradas</div>
              ) : (
                <div className="cuentas-table-container">
                  <table className="cuentas-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Monto</th>
                        <th>Vencimiento</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuentas.map(cuenta => (
                        <tr key={cuenta.id}>
                          <td>{cuenta.nombre}</td>
                          <td>${cuenta.monto.toFixed(2)}</td>
                          <td>{formatFecha(cuenta.fechaVencimiento)}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="edit-button"
                                onClick={() => setEditingCuenta(cuenta)}
                              >
                                Editar
                              </button>
                              <button 
                                className="delete-button"
                                onClick={() => handleDeleteCuenta(cuenta.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionCuentas;
