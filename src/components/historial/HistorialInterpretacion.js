import React from 'react';

const HistorialInterpretacion = ({ resumenGeneral, datosAgrupados, formatMonto }) => {
  return (
    <div className="interpretacion">
      <h3>Interpretación</h3>
      <p>A continuación se presenta un análisis de tus gastos:</p>
      <ul>
        <li>
          <span className="dot blue"></span>
          <strong>Monto total en el período seleccionado:</strong> {formatMonto(resumenGeneral.totalMonto)}
        </li>
        <li>
          <span className="dot green"></span>
          <strong>Has pagado:</strong> {formatMonto(resumenGeneral.totalPagado)} ({resumenGeneral.porcentajePagado}% del total)
        </li>
        <li>
          <span className="dot red"></span>
          <strong>Categoría con más gasto:</strong> {datosAgrupados.porCategoria.length > 0
            ? `${datosAgrupados.porCategoria[0].categoria} (${formatMonto(datosAgrupados.porCategoria[0].totalMonto)})`
            : 'Sin datos'}
        </li>
      </ul>

      {datosAgrupados.porMes.length > 1 && ( // O usar datosAgrupados.porCategoria.length
        <div className="tabla-categorias">
          <h4>Categorías con mayor gasto</h4>
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Monto</th>
                <th>% del Total</th>
              </tr>
            </thead>
            <tbody>
              {datosAgrupados.porCategoria.slice(0, 5).map(cat => (
                <tr key={cat.categoria}>
                  <td>{cat.categoria}</td>
                  <td>{formatMonto(cat.totalMonto)}</td>
                  {/* Asegurar que resumenGeneral.totalMonto no sea 0 para evitar NaN */}
                  <td>{resumenGeneral.totalMonto > 0 ? Math.round((cat.totalMonto / resumenGeneral.totalMonto) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistorialInterpretacion;
