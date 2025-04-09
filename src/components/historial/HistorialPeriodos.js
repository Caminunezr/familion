import React from 'react';

const HistorialPeriodos = ({
  datosAgrupados,
  agrupacion,
  periodoSeleccionado,
  seleccionarPeriodo,
  formatMonto,
  formatoFecha,
  onResetFilters // Añadir prop para resetear filtros
}) => {
  return (
    <div className="periodos-container">
      <h3>Períodos {datosAgrupados.porPeriodo.length > 0 ? `(${datosAgrupados.porPeriodo.length})` : ''}</h3>
      {datosAgrupados.porPeriodo.length === 0 ? (
        <div className="empty-periodos">
          <p>No hay datos para los filtros seleccionados</p>
          <button
            className="retry-button"
            onClick={onResetFilters} // Usar la prop
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
        <div className="periodos-lista">
          {datosAgrupados.porPeriodo.map((periodo, index) => (
            <div key={index} className="periodo-card">
              <div className="periodo-header" onClick={() => seleccionarPeriodo(periodo)}>
                <div className="periodo-info">
                  <h4>
                    {agrupacion === 'mes' ? periodo.etiqueta : periodo.categoria}
                  </h4>
                  <span className="periodo-stats">
                    {periodo.totalCuentas} cuenta{periodo.totalCuentas !== 1 ? 's' : ''} · {formatMonto(periodo.totalMonto)}
                  </span>
                </div>
                <div className="periodo-progreso">
                  <span className={periodo.porcentajePagado > 75 ? 'bueno' : periodo.porcentajePagado > 50 ? 'medio' : 'bajo'}>
                    {periodo.porcentajePagado}%
                  </span>
                  <div className="progreso-bar">
                    <div
                      className={`progreso ${periodo.porcentajePagado > 75 ? 'bueno' : periodo.porcentajePagado > 50 ? 'medio' : 'bajo'}`}
                      style={{ width: `${periodo.porcentajePagado}%` }}
                    ></div>
                  </div>
                </div>
                <div className="periodo-toggle">
                  {periodoSeleccionado === periodo ? '▼' : '▶'}
                </div>
              </div>

              {periodoSeleccionado === periodo && (
                <div className="detalle-periodo">
                  <h3>Detalle de Cuentas</h3>
                  <div className="periodo-resumen">
                    <div className="resumen-item">
                      <span className="label">Total:</span>
                      <span className="value">{formatMonto(periodo.totalMonto)}</span>
                    </div>
                    <div className="resumen-item">
                      <span className="label">Pagado:</span>
                      <span className="value">{formatMonto(periodo.montoPagado)}</span>
                    </div>
                    <div className="resumen-item">
                      <span className="label">Pendiente:</span>
                      <span className="value">{formatMonto(periodo.totalMonto - periodo.montoPagado)}</span>
                    </div>
                  </div>
                  <div className="tabla-container">
                    <table className="tabla-cuentas">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Categoría</th>
                          <th>Monto</th>
                          <th>Pagado</th>
                          <th>Vencimiento</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodo.cuentas.map(cuenta => (
                          <tr key={cuenta.id} className={cuenta.estaPagada ? 'pagada' : 'pendiente'}>
                            <td>{cuenta.nombre}</td>
                            <td>{cuenta.categoria}</td>
                            <td className="monto">{formatMonto(cuenta.monto)}</td>
                            <td className="monto">{formatMonto(cuenta.totalPagado)}</td>
                            <td>{formatoFecha(cuenta.fechaVencimiento)}</td>
                            <td>
                              <span className={`estado-badge ${cuenta.estaPagada ? 'pagado' : 'pendiente'}`}>
                                {cuenta.estaPagada ? 'Pagado' : 'Pendiente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistorialPeriodos;
