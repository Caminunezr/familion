import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import NavBar from '../NavBar';
import HistorialResumen from './HistorialResumen';
import HistorialGraficos from './HistorialGraficos';
import HistorialFiltros from './HistorialFiltros';
import HistorialListado from './HistorialListado';
import HistorialDetalles from './HistorialDetalles';
import HistorialComparativa from './HistorialComparativa';
import { useHistorialData } from './hooks/useHistorialData';
import { exportarHistorialCSV } from '../../services/historial';
import styles from './Historial.module.css';

function Historial() {
  const { currentUser } = useAuth();
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [showDetalles, setShowDetalles] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'table'
  
  const {
    filtros,
    setFiltros,
    agrupacion,
    setAgrupacion,
    cuentasProcesadas,
    datosAgrupados,
    mesesDisponibles,
    mesSeleccionado,
    setMesSeleccionado,
    resumenMesSeleccionado,
    datosGraficos,
    categorias,
    loading,
    error
  } = useHistorialData();
  
  // Manejo de exportación
  const handleExport = async () => {
    try {
      await exportarHistorialCSV(filtros);
    } catch (err) {
      console.error('Error al exportar:', err);
      // Mostrar notificación de error
    }
  };
  
  // Mostrar detalles de una cuenta
  const handleShowDetails = (cuenta) => {
    setCuentaSeleccionada(cuenta);
    setShowDetalles(true);
  };
  
  // Cerrar modal de detalles
  const handleCloseDetails = () => {
    setShowDetalles(false);
    setCuentaSeleccionada(null);
  };
  
  return (
    <div className={styles['historial-page']}>
      <NavBar />
      <div className={styles['historial-main']}>
        <div className={styles['historial-header']}>
          <h2 className={styles['historial-titulo']}>Historial Financiero Familiar</h2>
          <div className={styles['view-controls']}>
            <button 
              className={`${styles['view-btn']} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <i className="fas fa-th"></i> Cuadrícula
            </button>
            <button 
              className={`${styles['view-btn']} ${viewMode === 'table' ? styles.active : ''}`}
              onClick={() => setViewMode('table')}
            >
              <i className="fas fa-list"></i> Tabla
            </button>
          </div>
        </div>
        
        <div className={styles['historial-content-grid']}>
          {/* Panel lateral con filtros */}
          <div className={styles['historial-sidebar']}>
            <div className={styles.card}>
              <HistorialFiltros 
                filtros={filtros}
                categorias={categorias}
                mesesDisponibles={mesesDisponibles}
                mesSeleccionado={mesSeleccionado}
                agrupacion={agrupacion}
                onFilterChange={(name, value) => setFiltros(prev => ({ ...prev, [name]: value }))}
                onAgrupacionChange={setAgrupacion}
                onMesChange={setMesSeleccionado}
                onExport={handleExport}
              />
            </div>
          </div>
          
          {/* Contenido principal */}
          <div className={styles['historial-content']}>
            {/* Tarjetas de resumen */}
            <div className={styles.card}>
              <HistorialResumen resumen={resumenMesSeleccionado} />
            </div>
            
            {/* Gráficos */}
            <div className={styles.card}>
              <HistorialGraficos 
                graficos={datosGraficos}
                mesSeleccionado={mesSeleccionado} 
              />
            </div>
            
            {/* Listado de cuentas */}
            <div className={styles.card}>
              <HistorialListado 
                datosAgrupados={datosAgrupados}
                agrupacion={agrupacion}
                viewMode={viewMode}
                onVerDetalles={handleShowDetails}
                loading={loading}
              />
            </div>
            
            {/* Comparativa de periodos */}
            <div className={styles.card}>
              <HistorialComparativa 
                comparativa={{ porPeriodo: datosAgrupados.porMes || [] }} 
              />
            </div>
          </div>
        </div>
        
        {/* Modal de detalles */}
        {showDetalles && cuentaSeleccionada && (
          <HistorialDetalles 
            cuenta={cuentaSeleccionada} 
            onClose={handleCloseDetails} 
          />
        )}
        
        {/* Mensajes de estado */}
        {loading && <div className={styles['loading-overlay']}>Cargando datos de historial...</div>}
        {error && <div className={styles['error-message']}>{error}</div>}
      </div>
    </div>
  );
}

export default Historial;

const obtenerMesEtiqueta = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
};

// Función para mostrar el nombre completo del mes
const obtenerMesNombreCompleto = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
};
