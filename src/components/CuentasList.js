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

const formatMonto = (monto) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(monto);
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
              <div className="cuenta-icono-grande">
                <span className="categoria-icon-grande">{categoriaIcono[cat]}</span>
              </div>
              <div className="cuenta-header mejorada">
                <h3>
                  {cuenta.nombre}
                </h3>
                <div className="cuenta-badges mejorada">
                  <span className={`cuenta-categoria mejorada ${catClase}`}>{cat}</span>
                  <span className={`cuenta-estado mejorada estado-${estado}`}>{
                    estado === 'pagado' ? 'Pagada' : estado === 'vencida' ? 'Vencida' : 'Pendiente'
                  }</span>
                  {cuenta.facturaUrl && (
                    <span className="factura-icon mejorada" title="Tiene factura/boleta">📄</span>
                  )}
                </div>
              </div>
              <div className="cuenta-details mejorada">
                <div className="cuenta-amount-grande"><strong>Monto:</strong> <span className="monto-destacado">{formatMonto(cuenta.monto)}</span></div>
                <div><strong>Pagado:</strong> {formatMonto(cuenta.totalPagado || 0)}</div>
                <div><strong>Proveedor:</strong> {cuenta.proveedor || 'No especificado'}</div>
                <div><strong>Vencimiento:</strong> {formatFecha(cuenta.fechaVencimiento)}</div>
              </div>
              {cuenta.facturaUrl && (
                <div className="cuenta-factura mejorada">
                  <span className="factura-icon">📄</span>
                  Factura disponible
                </div>
              )}
              <div className="cuenta-creator mejorada">
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
