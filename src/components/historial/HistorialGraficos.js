import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import styles from './Historial.module.css';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

// Asegúrate que ChartJS esté registrado
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Definir estructura por defecto más robusta
const defaultGraficosData = {
  categorias: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
  pagosVsVencimientos: { labels: [], datasets: [{ label: '', data: [], backgroundColor: '' }] }
};

// Definir colores por categoría igual que en Gestión de Cuentas
const categoriaColor = {
  'Luz': '#ffe082', // Amarillo
  'Agua': '#81d4fa', // Celeste
  'Gas': '#ffab91', // Naranja
  'Internet': '#b3e5fc', // Azul claro
  'Arriendo': '#c8e6c9', // Verde claro
  'Gasto Común': '#f8bbd0', // Rosa
  'Utiles de Aseo': '#aed581', // Verde
  'Otros': '#d1c4e9', // Lila
};

const HistorialGraficos = ({ graficos = defaultGraficosData, mesSeleccionado }) => {
  // Si hay labels y no hay backgroundColor, aplicar colores por categoría
  const datosCategorias = React.useMemo(() => {
    if (!graficos?.categorias) return defaultGraficosData.categorias;
    const labels = graficos.categorias.labels || [];
    const data = graficos.categorias.datasets?.[0]?.data || [];
    let backgroundColor = graficos.categorias.datasets?.[0]?.backgroundColor;
    if (!backgroundColor || backgroundColor.length !== labels.length) {
      backgroundColor = labels.map(cat => categoriaColor[cat] || '#BDBDBD');
    }
    return {
      labels,
      datasets: [{ data, backgroundColor }]
    };
  }, [graficos]);

  // Acceso seguro a las propiedades, usando la estructura por defecto si es necesario
  const datosPagosVencimientos = graficos?.pagosVsVencimientos || defaultGraficosData.pagosVsVencimientos;

  // Obtener nombre completo del mes seleccionado
  const obtenerMesNombreCompleto = (ym) => {
    if (!ym) return 'Mes actual';
    const [y, m] = ym.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[parseInt(m, 10) - 1]} ${y}`;
  };

  // Opciones para el gráfico de dona (categorías)
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 15, padding: 15, color: '#1976d2', font: { family: 'Segoe UI', size: 14 } }
      },
      title: {
        display: true,
        text: `Distribución por Categoría - ${obtenerMesNombreCompleto(mesSeleccionado)}`,
        color: '#1976d2',
        font: { family: 'Segoe UI', size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: $${value.toLocaleString()}`;
          }
        }
      }
    },
    animation: { duration: 900, easing: 'easeOutQuart' },
    layout: { padding: 10 },
  };

  // Opciones para el gráfico de barras (evolución mensual)
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#1976d2', font: { family: 'Segoe UI', size: 14 } } },
      title: {
        display: true,
        text: 'Evolución de Pagos por Mes',
        color: '#1976d2',
        font: { family: 'Segoe UI', size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Pagado: $${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#1976d2', font: { family: 'Segoe UI', size: 13 } },
        grid: { color: '#e3f2fd' }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#1976d2', font: { family: 'Segoe UI', size: 13 } },
        grid: { color: '#e3f2fd' }
      }
    },
    animation: { duration: 900, easing: 'easeOutQuart' },
    layout: { padding: 10 },
  };

  // Verificar si hay datos válidos para mostrar
  const hayDatosCategorias = datosCategorias.labels && datosCategorias.labels.length > 0 && datosCategorias.datasets?.[0]?.data?.length > 0;
  const hayDatosPagosVencimientos = datosPagosVencimientos.labels && datosPagosVencimientos.labels.length > 0 && datosPagosVencimientos.datasets?.[0]?.data?.length > 0;

  return (
    <div className={styles['graficos-container']}>
      <div className={styles['grafico-card']}>
        {hayDatosCategorias ? (
          <div className={styles['grafico-dona']}>
            <Doughnut data={datosCategorias} options={doughnutOptions} />
          </div>
        ) : (
          <div className={styles['empty-state']}>No hay datos de categorías para mostrar.</div>
        )}
      </div>
      <div className={styles['grafico-card']}>
        {hayDatosPagosVencimientos ? (
          <div className={styles['grafico-barras']}>
            <Bar data={datosPagosVencimientos} options={barOptions} />
          </div>
        ) : (
          <div className={styles['empty-state']}>No hay datos de comparación para mostrar.</div>
        )}
      </div>
    </div>
  );
};

export default HistorialGraficos;
