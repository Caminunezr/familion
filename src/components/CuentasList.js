import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './CuentasList.css';

const CuentasList = ({ cuentas, onSelectCuenta, estadoLabel }) => {
  const { currentUser } = useAuth();
  
  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES');
  };
  
  const getCategoriaClass = (categoria) => {
    const categorias = {
      'Luz': 'categoria-luz',
      'Agua': 'categoria-agua',
      'Gas': 'categoria-gas',
      'Internet': 'categoria-internet',
      'Utiles de Aseo': 'categoria-utiles-de-aseo',
      'Otros': 'categoria-otros'
    };
    
    return categorias[categoria] || 'categoria-otros';
  };
  
  if (cuentas.length === 0) {
    return <div className="cuentas-empty">No hay cuentas {estadoLabel.toLowerCase()}s.</div>;
  }
  
  return (
    <div className="cuentas-list">
      {cuentas.map(cuenta => (
        <div 
          key={cuenta.id} 
          className={`cuenta-card ${cuenta.estaPagada ? 'cuenta-pagada' : 'cuenta-pendiente'}`}
          onClick={() => onSelectCuenta && onSelectCuenta(cuenta)}
        >
          <div className="cuenta-header">
            <h3>{cuenta.nombre}</h3>
            <div className="cuenta-badges">
              <span className={`cuenta-categoria ${getCategoriaClass(cuenta.categoria)}`}>
                {cuenta.categoria || 'Sin categoría'}
              </span>
              <span className={`cuenta-estado ${cuenta.estaPagada ? 'estado-pagado' : 'estado-pendiente'}`}>
                {estadoLabel}
              </span>
            </div>
          </div>
          
          <div className="cuenta-details">
            <div className="cuenta-provider">
              <strong>Proveedor:</strong> {cuenta.proveedor || 'No especificado'}
            </div>
            <div className="cuenta-amount">
              <strong>Monto:</strong> ${cuenta.monto.toFixed(2)}
            </div>
            <div className="cuenta-payment">
              <strong>Pagado:</strong> ${(cuenta.totalPagado || 0).toFixed(2)}
            </div>
            <div className="cuenta-due-date">
              <strong>Vencimiento:</strong> {formatFecha(cuenta.fechaVencimiento)}
            </div>
          </div>
          
          {cuenta.rutaFactura && (
            <div className="cuenta-factura">
              <span className="factura-icon">📄</span>
              Factura disponible
            </div>
          )}
          
          <div className="cuenta-creator">
            <span className="creator-label">Creado por:</span>
            <span className="creator-value">{cuenta.usuarioCreacion === currentUser.uid ? 'Tú' : 'Familiar'}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CuentasList;
