import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Paleta de colores para usuarios (puedes agregar más si hay más usuarios)
const USER_COLORS = [
  '#4CAF50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4', '#ffc107', '#607d8b', '#f44336', '#8bc34a'
];

function getColor(idx) {
  return USER_COLORS[idx % USER_COLORS.length];
}

const PresupuestoGraficos = ({ datos = {}, aportesPorUsuario = {} }) => {
  // Gráfico de progreso (dona)
  const progresoData = {
    labels: ['Aportado', 'Restante'],
    datasets: [
      {
        data: [datos.totalAportado || 0, datos.restante || 0],
        backgroundColor: ['#4CAF50', '#e0e0e0'],
        borderWidth: 1,
      },
    ],
  };

  // Gráfico de aportes por usuario (barras) - Usa los datos recibidos
  const usuarios = Object.keys(aportesPorUsuario);
  const montos = usuarios.map(u => aportesPorUsuario[u]);
  const userColors = usuarios.map((_, idx) => getColor(idx));

  const barrasData = {
    labels: usuarios,
    datasets: [
      {
        label: 'Total Aportado por Usuario',
        data: montos,
        backgroundColor: userColors,
      },
    ],
  };

  return (
    <div className="card" style={{ marginBottom: 25 }}>
      <h3>Visualización Gráfica</h3>
      <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ width: 220, minWidth: 180 }}>
          <Doughnut data={progresoData} options={{
            plugins: {
              legend: { display: true, position: 'bottom' }
            }
          }} />
          <div style={{ textAlign: 'center', marginTop: 10, fontWeight: 500 }}>
            Progreso del Mes
          </div>
        </div>
        <div style={{ width: 320, minWidth: 220 }}>
          <Bar data={barrasData} options={{
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }} />
          <div style={{ textAlign: 'center', marginTop: 10, fontWeight: 500 }}>
            Total por Usuario
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresupuestoGraficos;
