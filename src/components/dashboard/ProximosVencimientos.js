import React from 'react';

// Asumiendo que cuentasProximasVencer, handleSelectCuenta y formatoFecha se pasan como props
const ProximosVencimientos = ({ cuentasProximasVencer, handleSelectCuenta, formatoFecha }) => {
  return (
    <div className="proximas-vencer">
      <div className="section-header">
        <h3>Próximos Vencimientos</h3>
      </div>
      {cuentasProximasVencer.length === 0 ? (
        <div className="empty-state">No hay cuentas próximas a vencer en los siguientes 10 días</div>
      ) : (
        <div className="proximas-lista">
          {cuentasProximasVencer.map(cuenta => (
            <div
              key={cuenta.id}
              className="proxima-cuenta"
              onClick={() => handleSelectCuenta(cuenta)}
            >
              <div className="proxima-info">
                <div className="proxima-nombre">{cuenta.nombre}</div>
                <div className="proxima-fecha">Vence: {formatoFecha(cuenta.fechaVencimiento)}</div>
              </div>
              <div className="proxima-monto">${cuenta.monto.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProximosVencimientos;
