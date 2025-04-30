import React from 'react';

const formatoMoneda = (valor) =>
  valor?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

const formatoFechaCorta = (fechaAporte) => {
  if (!fechaAporte) return 'N/A';
  // Si es timestamp numérico de Firebase
  if (typeof fechaAporte === 'number') {
    return new Date(fechaAporte).toLocaleDateString('es-CL');
  }
  // Si es string ISO
  if (typeof fechaAporte === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaAporte)) {
    return new Date(fechaAporte).toLocaleDateString('es-CL');
  }
  return 'N/A';
};

const PresupuestoAportesLista = ({ aportes = [], onEditar, onEliminar }) => (
  <div className="aportes-lista-section card">
    <h3>Historial de Aportes ({aportes.length})</h3>
    {aportes.length === 0 ? (
      <p>Aún no se han registrado aportes para este presupuesto.</p>
    ) : (
      <ul className="aportes-lista">
        {aportes.map(aporte => (
          <li
            key={aporte.id}
            className={`aporte-item ${aporte.tipo === 'cuenta' ? 'tipo-cuenta' : 'tipo-manual'}`}
          >
            <div className="aporte-info">
              <span className="aporte-monto">{formatoMoneda(aporte.monto)}</span>
              <span className="aporte-aportador">por {aporte.aportadorNombre}</span>
              {aporte.tipo === 'cuenta' && aporte.cuentaNombre && (
                <span className="aporte-detalle-cuenta"> (Pago: {aporte.cuentaNombre})</span>
              )}
            </div>
            <span className="aporte-fecha">{formatoFechaCorta(aporte.fechaAporte)}</span>
            {(onEditar || onEliminar) && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                {onEditar && (
                  <button
                    className="toggle-aporte-form-btn"
                    style={{ background: '#ffc107', color: '#333', padding: '4px 10px', fontSize: '0.9em' }}
                    onClick={() => onEditar(aporte)}
                  >
                    Editar
                  </button>
                )}
                {onEliminar && (
                  <button
                    className="toggle-aporte-form-btn"
                    style={{ background: '#d32f2f', color: '#fff', padding: '4px 10px', fontSize: '0.9em' }}
                    onClick={() => onEliminar(aporte)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default PresupuestoAportesLista;
