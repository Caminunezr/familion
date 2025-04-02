import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import CuentasList from './CuentasList';
import CuentaDetalle from './CuentaDetalle';
import PagoForm from './PagoForm';
import db from '../utils/database';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [refreshCuentas, setRefreshCuentas] = useState(0);
  const [cuentasPendientes, setCuentasPendientes] = useState([]);
  const [cuentasPagadas, setCuentasPagadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pendientes');

  useEffect(() => {
    const fetchCuentas = async () => {
      try {
        setLoading(true);
        // Obtener todas las cuentas
        const cuentasArray = await db.cuentas.toArray();
        
        // Obtener todos los pagos
        const pagosArray = await db.pagos.toArray();
        
        // Crear un mapa de cuentaId -> total pagado
        const pagosPorCuenta = {};
        pagosArray.forEach(pago => {
          if (!pagosPorCuenta[pago.cuentaId]) {
            pagosPorCuenta[pago.cuentaId] = 0;
          }
          pagosPorCuenta[pago.cuentaId] += pago.montoPagado;
        });
        
        // Separar cuentas pagadas y pendientes
        const pendientes = [];
        const pagadas = [];
        
        cuentasArray.forEach(cuenta => {
          const totalPagado = pagosPorCuenta[cuenta.id] || 0;
          const estaPagada = totalPagado >= cuenta.monto;
          
          // Añadir el total pagado a la cuenta para mostrar
          const cuentaConPago = {
            ...cuenta,
            totalPagado,
            estaPagada
          };
          
          if (estaPagada) {
            pagadas.push(cuentaConPago);
          } else {
            pendientes.push(cuentaConPago);
          }
        });
        
        // Ordenar cuentas pendientes por fecha de vencimiento
        pendientes.sort((a, b) => {
          if (!a.fechaVencimiento) return 1;
          if (!b.fechaVencimiento) return -1;
          return new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento);
        });
        
        // Ordenar cuentas pagadas por fecha de pago (último pago)
        pagadas.sort((a, b) => {
          const ultimoPagoA = pagosArray
            .filter(pago => pago.cuentaId === a.id)
            .sort((p1, p2) => new Date(p2.fechaPago) - new Date(p1.fechaPago))[0];
            
          const ultimoPagoB = pagosArray
            .filter(pago => pago.cuentaId === b.id)
            .sort((p1, p2) => new Date(p2.fechaPago) - new Date(p1.fechaPago))[0];
            
          if (!ultimoPagoA) return 1;
          if (!ultimoPagoB) return -1;
          
          return new Date(ultimoPagoB.fechaPago) - new Date(ultimoPagoA.fechaPago);
        });
        
        setCuentasPendientes(pendientes);
        setCuentasPagadas(pagadas);
      } catch (error) {
        console.error('Error al cargar cuentas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCuentas();
  }, [refreshCuentas]);

  const handleSelectCuenta = (cuenta) => {
    setSelectedCuenta(cuenta);
    setShowDetalle(true);
    setShowPagoForm(false);
  };

  const handlePagoClick = () => {
    setShowPagoForm(true);
    setShowDetalle(false);
  };

  const handleBackClick = () => {
    setShowDetalle(false);
    setSelectedCuenta(null);
  };

  const handlePagoSuccess = () => {
    setShowPagoForm(false);
    setSelectedCuenta(null);
    setShowDetalle(false);
    setRefreshCuentas(prev => prev + 1);
  };

  return (
    <div className="dashboard-page">
      <NavBar />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Panel Principal</h2>
          <div className="tab-buttons">
            <button 
              className={activeTab === 'pendientes' ? 'active' : ''} 
              onClick={() => setActiveTab('pendientes')}
            >
              Cuentas Pendientes ({cuentasPendientes.length})
            </button>
            <button 
              className={activeTab === 'pagadas' ? 'active' : ''} 
              onClick={() => setActiveTab('pagadas')}
            >
              Cuentas Pagadas ({cuentasPagadas.length})
            </button>
          </div>
        </div>
        
        <div className="dashboard-content">
          {!showDetalle && !showPagoForm ? (
            <div className="cuentas-container">
              {loading ? (
                <div className="loading-message">Cargando cuentas...</div>
              ) : activeTab === 'pendientes' ? (
                <CuentasList 
                  cuentas={cuentasPendientes} 
                  onSelectCuenta={handleSelectCuenta}
                  estadoLabel="Pendiente"
                />
              ) : (
                <CuentasList 
                  cuentas={cuentasPagadas} 
                  onSelectCuenta={handleSelectCuenta}
                  estadoLabel="Pagada"
                />
              )}
            </div>
          ) : showPagoForm ? (
            <PagoForm 
              cuenta={selectedCuenta} 
              onSuccess={handlePagoSuccess}
              onCancel={() => {
                setShowPagoForm(false);
                if (selectedCuenta) setShowDetalle(true);
              }}
            />
          ) : (
            <CuentaDetalle 
              cuenta={selectedCuenta}
              onBackClick={handleBackClick}
              onPagoClick={handlePagoClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
