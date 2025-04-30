import React from 'react';

function exportarAportesCSV(aportes) {
  if (!aportes || aportes.length === 0) return;

  const encabezado = [
    'ID',
    'Monto',
    'Aportador',
    'Fecha',
    'Tipo',
    'Cuenta Asociada'
  ];
  const filas = aportes.map(a => [
    a.id,
    a.monto,
    a.aportadorNombre,
    typeof a.fechaAporte === 'number'
      ? new Date(a.fechaAporte).toLocaleDateString('es-CL')
      : (a.fechaAporte || ''),
    a.tipo,
    a.cuentaNombre || ''
  ]);

  const csv =
    [encabezado, ...filas]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `aportes_presupuesto.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const PresupuestoExportar = ({ datos = [] }) => (
  <div style={{ textAlign: 'right', margin: '10px 0 20px 0' }}>
    <button
      className="toggle-aporte-form-btn"
      style={{ background: '#607d8b' }}
      onClick={() => exportarAportesCSV(datos)}
      disabled={!datos || datos.length === 0}
    >
      Exportar aportes a CSV
    </button>
  </div>
);

export default PresupuestoExportar;
