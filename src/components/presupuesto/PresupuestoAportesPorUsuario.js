import React from 'react';

const formatoMoneda = (valor) =>
  valor?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

const PresupuestoAportesPorUsuario = ({ aportesPorUsuario = {} }) => {
  const usuarios = Object.keys(aportesPorUsuario);

  if (usuarios.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 25 }}>
      <h3>Aportes por Usuario</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', color: '#555' }}>Usuario</th>
            <th style={{ textAlign: 'right', padding: '8px', color: '#555' }}>Total Aportado</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(nombre => (
            <tr key={nombre}>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{nombre}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                {formatoMoneda(aportesPorUsuario[nombre])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PresupuestoAportesPorUsuario;
