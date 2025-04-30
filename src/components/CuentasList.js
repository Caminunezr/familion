import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './CuentasList.css';

const categoriaIcono = {
  'Luz': '💡',
  'Agua': '💧',
  'Gas': '🔥',
  'Internet': '🌐',
  'Arriendo': '🏠',
  'Gasto Común': '🧾',
  'Otros': '📦',
};

const categoriaClase = {
  'Luz': 'luz',
  'Agua': 'agua',
  'Gas': 'gas',
  'Internet': 'internet',
  'Arriendo': 'arriendo',
  'Gasto Común': 'gasto-comun',
  'Otros': 'otros',
};

const CuentasList = ({ cuentas, onSelectCuenta, estadoLabel, onDeleteCuenta }) => {
  const { currentUser } = useAuth();

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES');
  };

  // Determina el estado real de la cuenta
  const getEstado = (cuenta) => {
    if (cuenta.estaPagada) return 'pagado';
    if (cuenta.vencida) return 'vencida';
    return 'pendiente';
  };

  if (cuentas.length === 0) {
    return <div className="cuentas-empty">No hay cuentas {estadoLabel.toLowerCase()}s.</div>;
  }

  return (
    <div className="cuentas-list">
      {cuentas.map(cuenta => {
        const cat = cuenta.categoria || 'Otros';
        const catClase = categoriaClase[cat] || 'otros';
        const estado = getEstado(cuenta);
        return (
          <div
            key={cuenta.id}
            className={`cuenta-card ${catClase} ${estado ? `estado-${estado}` : ''}`}
            onClick={() => onSelectCuenta && onSelectCuenta(cuenta)}
          >
            <button
              className="cuenta-delete-button"
              onClick={e => {
                e.stopPropagation();
                onDeleteCuenta && onDeleteCuenta(cuenta.id);
              }}
              aria-label={`Eliminar cuenta ${cuenta.nombre}`}
            >
              🗑️
            </button>
            <div className="cuenta-card-content">
              <div className="cuenta-header">
                <h3>
                  <span className="categoria-icon">{categoriaIcono[cat]}</span>
                  {cuenta.nombre}
                </h3>
                <div className="cuenta-badges">
                  <span className={`cuenta-categoria ${catClase}`}>{cat}</span>
                  <span className={`cuenta-estado estado-${estado}`}>{
                    estado === 'pagado' ? 'Pagada' : estado === 'vencida' ? 'Vencida' : 'Pendiente'
                  }</span>
                  {cuenta.facturaUrl && (
                    <span className="factura-icon" title="Tiene factura/boleta">📄</span>
                  )}
                </div>
              </div>
              <div className="cuenta-details">
                <div><strong>Proveedor:</strong> {cuenta.proveedor || 'No especificado'}</div>
                <div className="cuenta-amount"><strong>Monto:</strong> ${cuenta.monto.toFixed(2)}</div>
                <div><strong>Pagado:</strong> ${(cuenta.totalPagado || 0).toFixed(2)}</div>
                <div><strong>Vencimiento:</strong> {formatFecha(cuenta.fechaVencimiento)}</div>
              </div>
              {cuenta.facturaUrl && (
                <div className="cuenta-factura">
                  <span className="factura-icon">📄</span>
                  Factura disponible
                </div>
              )}
              <div className="cuenta-creator">
                <span className="creator-label">Creado por:</span>
                <span className="creator-value">
                  {cuenta.creadorId === currentUser.uid ? 'Tú' : (cuenta.creadorNombre || 'Familiar')}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CuentasList;
