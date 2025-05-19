// src/components/historial/hooks/useHistorialData.js
import { useState, useEffect, useMemo } from 'react';
import { obtenerHistorialCuentas, obtenerPagosPorCuenta, obtenerCategorias } from '../../../services/historial';
import { procesarCuentasYPagosHistorial, agruparDatosHistorial, filtrarCuentasHistorial } from '../../../utils/historialUtils';

export function useHistorialData(filtrosIniciales = {}) {
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    categoria: 'todas',
    estado: 'todos',
    ...filtrosIniciales
  });
  
  const [agrupacion, setAgrupacion] = useState('mes');
  const [cuentas, setCuentas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  
  // Cargar datos iniciales
  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);
      setError(null);
      try {
        // Cargar categorías
        const categoriasData = await obtenerCategorias();
        setCategorias(categoriasData);
        
        // Cargar cuentas con filtros aplicados
        const cuentasData = await obtenerHistorialCuentas(filtros);
        setCuentas(cuentasData);
        
        // Para cada cuenta, cargar sus pagos
        const pagosPromises = cuentasData.map(cuenta => 
          obtenerPagosPorCuenta(cuenta.id)
        );
        
        const pagosData = await Promise.all(pagosPromises);
        // Aplanar el array de arrays
        setPagos(pagosData.flat());
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos de historial:', err);
        setError('No se pudieron cargar los datos. Intente nuevamente.');
        setLoading(false);
      }
    }
    
    cargarDatos();
  }, [filtros]); // Recargar cuando cambien los filtros
  
  // Procesar y transformar datos
  const cuentasProcesadas = useMemo(() => 
    procesarCuentasYPagosHistorial(cuentas, pagos), 
    [cuentas, pagos]
  );

  // Aplicar filtros en frontend además de backend
  const cuentasFiltradas = useMemo(() => 
    filtrarCuentasHistorial(cuentasProcesadas, filtros),
    [cuentasProcesadas, filtros]
  );

  const datosAgrupados = useMemo(() => 
    agruparDatosHistorial(cuentasFiltradas, agrupacion, (ym) => {
      if (!ym) return '';
      const [y, m] = ym.split('-');
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${meses[parseInt(m, 10) - 1]} ${y}`;
    }), 
    [cuentasFiltradas, agrupacion]
  );
  
  // Calcular meses disponibles y seleccionar uno por defecto
  const mesesDisponibles = useMemo(() => {
    const meses = Array.from(new Set(cuentasFiltradas
      .map(c => c.fechaVencimiento?.slice(0, 7))
      .filter(Boolean)))
      .sort()
      .reverse();
      
    if ((!mesSeleccionado || !meses.includes(mesSeleccionado)) && meses.length > 0) {
      setMesSeleccionado(meses[0]);
    }
    
    return meses;
  }, [cuentasFiltradas, mesSeleccionado]);
  
  // Calcular resumen para el mes seleccionado
  const resumenMesSeleccionado = useMemo(() => {
    const mes = datosAgrupados.porMes?.find(m => m.periodo === mesSeleccionado);
    if (!mes) return { totalCuentas: 0, totalMonto: 0, totalPagado: 0, porcentajePagado: 0 };
    
    return {
      totalCuentas: mes.totalCuentas,
      totalMonto: mes.totalMonto,
      totalPagado: mes.montoPagado,
      porcentajePagado: mes.porcentajePagado
    };
  }, [datosAgrupados.porMes, mesSeleccionado]);
  
  // Generar datos para gráficos
  const datosGraficos = useMemo(() => {
    const mes = datosAgrupados.porMes?.find(m => m.periodo === mesSeleccionado);
    const categorias = mes?.cuentas.reduce((acc, c) => {
      acc[c.categoria] = (acc[c.categoria] || 0) + (parseFloat(c.totalPagado) || 0);
      return acc;
    }, {}) || {};
    
    const catLabels = Object.keys(categorias);
    const catData = Object.values(categorias);
    const catColors = ['#1976d2','#43a047','#fbc02d','#e64a19','#8e24aa','#00bcd4','#ff7043','#689f38','#f06292','#7e57c2'];
    
    const labelsMes = datosAgrupados.porMes?.map(m => m.etiqueta || m.periodo).reverse() || [];
    const dataMes = datosAgrupados.porMes?.map(m => m.montoPagado).reverse() || [];
    
    return {
      categorias: {
        labels: catLabels,
        datasets: [{ 
          data: catData, 
          backgroundColor: catLabels.map((_,i) => catColors[i % catColors.length]) 
        }]
      },
      pagosVsVencimientos: {
        labels: labelsMes,
        datasets: [{ 
          label: 'Total Pagado', 
          data: dataMes, 
          backgroundColor: '#1976d2' 
        }]
      }
    };
  }, [datosAgrupados, mesSeleccionado]);
  
  return {
    filtros,
    setFiltros,
    agrupacion,
    setAgrupacion,
    cuentasProcesadas: cuentasFiltradas, // ahora devuelve las filtradas
    datosAgrupados,
    mesesDisponibles,
    mesSeleccionado,
    setMesSeleccionado,
    resumenMesSeleccionado,
    datosGraficos,
    categorias,
    loading,
    error
  };
}
