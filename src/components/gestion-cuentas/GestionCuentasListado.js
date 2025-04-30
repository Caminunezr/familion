import React from 'react';

// Iconos por categoría (puedes cambiar por SVGs si lo prefieres)
const categoriaIcono = {
  'Luz': '💡',
  'Agua': '💧',
  'Gas': '🔥',
  'Internet': '🌐',
  'Utiles de Aseo': '🧹',
  'Arriendo': '🏠',
  'Gasto Común': '🏢',
  'Otros': '📦',
};

const getCategoriaClass = (categoria) => {
  switch (categoria) {
    case 'Luz': return 'cat-luz';
    case 'Agua': return 'cat-agua';
    case 'Gas': return 'cat-gas';
    case 'Internet': return 'cat-internet';
    case 'Utiles de Aseo': return 'cat-aseo';
    case 'Otros': return 'cat-otros';
    case 'Arriendo': return 'cat-arriendo';
    case 'Gasto Común': return 'cat-gasto-comun';
    default: return '';
  }
};

const getEstadoCuenta = (cuenta) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaVenc = cuenta.fecha_vencimiento ? new Date(cuenta.fecha_vencimiento) : null;
  if (fechaVenc && fechaVenc < hoy) {
    return { estado: 'Vencida', clase: 'vencida' };
  }
  return { estado: 'Pendiente', clase: 'pendiente' };
};

const GestionCuentasListado = ({
  loading,
  error,
  cuentas,
  searchTerm,
  onAbrirPanel,
  onAbrirFormularioNuevo,
  onEliminarCuenta,
}) => {
  if (loading) {
    return <p>Cargando cuentas...</p>;
  }
  if (error && !cuentas.length) {
    return <p className="error-message">{error}</p>;
  }
  if (cuentas.length === 0 && !searchTerm) {
    return (
      <div className="empty-state-gc">
        <div className="empty-icon-gc">📋</div>
        <h3>No se encontraron cuentas</h3>
        <p>No tienes cuentas creadas. ¡Crea tu primera cuenta!</p>
        <button className="crear-cuenta-btn-empty" onClick={onAbrirFormularioNuevo}>
          + Crear Nueva Cuenta
        </button>
      </div>
    );
  }
  if (cuentas.length === 0 && searchTerm) {
    return <p>No se encontraron cuentas que coincidan con "{searchTerm}".</p>;
  }
  return (
    <div className="cuentas-list-gc">
      {cuentas.map(cuenta => {
        const { estado, clase } = getEstadoCuenta(cuenta);
        const tituloPrincipal = cuenta.proveedor_nombre || cuenta.descripcion || cuenta.categoria || 'Cuenta';
        const proveedorDisplay = cuenta.proveedor_nombre || (cuenta.proveedor ? `ID: ${cuenta.proveedor}` : 'N/A');
        const icono = categoriaIcono[cuenta.categoria] || '📦';
        return (
          <div
            className={`cuenta-card-gc ${clase} ${getCategoriaClass(cuenta.categoria)}`}
            style={{ minHeight: 'auto', display: 'flex', alignItems: 'center', gap: 18 }}
            key={cuenta.id}
            onClick={() => onAbrirPanel && onAbrirPanel(cuenta)}
          >
            {/* Icono de categoría */}
            <div style={{ fontSize: '2.2rem', marginRight: 18, flexShrink: 0, filter: 'drop-shadow(0 1px 2px #bbb)' }}>
              {icono}
            </div>
            {/* Contenido principal */}
            <div className="cuenta-card-content" style={{ flex: 1, minWidth: 0 }}>
              <div className="cuenta-card-header">
                <span className="cuenta-nombre" style={{ fontSize: '1.15rem', fontWeight: 700 }}>{tituloPrincipal}</span>
                <span className={`cuenta-estado-badge ${clase}`}>{estado}</span>
              </div>
              <div className="cuenta-card-details">
                <span><strong>Categoría:</strong> {cuenta.categoria}</span>
                {proveedorDisplay !== tituloPrincipal && proveedorDisplay !== 'N/A' && (
                  <span><strong>Proveedor:</strong> {proveedorDisplay}</span>
                )}
                <span style={{ fontWeight: 600, color: '#1976d2' }}><strong>Monto:</strong> {Number(cuenta.monto || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</span>
                <span><strong>Vence:</strong> {cuenta.fecha_vencimiento ? new Date(cuenta.fecha_vencimiento).toLocaleDateString('es-CL') : 'N/A'}</span>
                {cuenta.factura && <span className="factura-indicator" title="Factura adjunta">📄</span>}
              </div>
            </div>
            {/* Acciones solo visibles al hacer hover */}
            <div className="cuenta-card-actions" style={{ opacity: 0, pointerEvents: 'none', transition: 'opacity 0.2s' }}>
              <button className="btn-editar" onClick={e => { e.stopPropagation(); onAbrirPanel(cuenta); }}>
                Ver / Editar
              </button>
              {onEliminarCuenta && (
                <button className="btn-eliminar" onClick={e => { e.stopPropagation(); onEliminarCuenta(cuenta.id); }}>
                  Eliminar
                </button>
              )}
            </div>
            {/* Mostrar acciones al hacer hover con CSS */}
            <style>{`
              .cuenta-card-gc:hover .cuenta-card-actions {
                opacity: 1 !important;
                pointer-events: auto !important;
              }
            `}</style>
          </div>
        );
      })}
    </div>
  );
};

export default GestionCuentasListado;
