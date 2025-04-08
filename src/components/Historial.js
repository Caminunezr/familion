import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import db from '../utils/database';
import './Historial.css';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Historial = () => {
  const { currentUser } = useAuth();
  
  // Estados de carga y datos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Estados de filtrado
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [agrupacion, setAgrupacion] = useState('mes');
  
  // Estados de visualización
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [datosAgrupados, setDatosAgrupados] = useState({
    porMes: [],
    porCategoria: [],
    porPeriodo: []
  });
  
  // Inicializar fechas de filtro por defecto
  useEffect(() => {
    // Fecha fin: hoy
    const fechaFin = new Date();
    
    // Fecha inicio: 6 meses atrás
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 6);
    
    // Formatear fechas para los inputs de tipo date
    setFiltroFechaInicio(fechaInicio.toISOString().split('T')[0]);
    setFiltroFechaFin(fechaFin.toISOString().split('T')[0]);
  }, []);
  
  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Iniciando carga de datos del historial...");
        
        // Cargar categorías para filtro
        const categoriasDB = await db.categorias.toArray();
        console.log("Categorías cargadas:", categoriasDB);
        
        // Filtrar para incluir solo las categorías válidas
        const categoriasValidas = ['Luz', 'Agua', 'Gas', 'Internet', 'Utiles de Aseo', 'Otros'];
        const categoriasUnicas = [];
        const nombresVistos = new Set();
        
        // Asegurar que tenemos todas las categorías válidas
        for (const nombreCategoria of categoriasValidas) {
          // Buscar primero en la base de datos
          const categoriaExistente = categoriasDB.find(
            cat => cat.nombre.toLowerCase() === nombreCategoria.toLowerCase()
          );
          
          if (categoriaExistente && !nombresVistos.has(nombreCategoria)) {
            categoriasUnicas.push(categoriaExistente);
            nombresVistos.add(nombreCategoria);
          } else if (!nombresVistos.has(nombreCategoria)) {
            // Si no existe, crear una versión por defecto
            categoriasUnicas.push({
              nombre: nombreCategoria,
              descripcion: `Gastos de ${nombreCategoria.toLowerCase()}`,
              color: getColorForCategoria(nombreCategoria)
            });
            nombresVistos.add(nombreCategoria);
          }
        }
        
        setCategorias(categoriasUnicas);
        console.log("Categorías procesadas:", categoriasUnicas);
        
        // Cargar cuentas y pagos en paralelo
        console.log("Cargando cuentas y pagos...");
        const [cuentasArray, pagosArray] = await Promise.all([
          db.cuentas.toArray(),
          db.pagos.toArray()
        ]);
        
        console.log("Cuentas cargadas:", cuentasArray.length);
        console.log("Pagos cargados:", pagosArray.length);
        
        // Procesar cuentas con sus pagos
        const cuentasProcesadas = procesarCuentasYPagos(cuentasArray, pagosArray);
        console.log("Cuentas procesadas:", cuentasProcesadas.length);
        
        // Aplicar filtros
        const cuentasFiltradas = filtrarCuentas(cuentasProcesadas);
        console.log("Cuentas filtradas:", cuentasFiltradas.length);
        setCuentas(cuentasFiltradas);
        
        // Guardar pagos para análisis
        setPagos(pagosArray);
        
        // Agrupar datos según selección
        const datosAgrupados = agruparDatos(cuentasFiltradas, agrupacion);
        setDatosAgrupados(datosAgrupados);
        
        console.log("Carga de datos completada con éxito");
      } catch (error) {
        console.error('Error al cargar datos del historial:', error);
        setError('No se pudieron cargar los datos. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, [filtroFechaInicio, filtroFechaFin, filtroCategoria, filtroEstado, agrupacion, refreshCounter]);
  
  // Función para obtener color predeterminado por categoría
  const getColorForCategoria = (categoria) => {
    const colores = {
      'Luz': '#f39c12',
      'Agua': '#3498db',
      'Gas': '#e74c3c',
      'Internet': '#9b59b6',
      'Utiles de Aseo': '#2ecc71',
      'Otros': '#95a5a6'
    };
    return colores[categoria] || '#95a5a6';
  };
  
  // Procesar cuentas y sus pagos
  const procesarCuentasYPagos = (cuentasArray, pagosArray) => {
    console.log("Procesando cuentas y pagos:", cuentasArray.length, pagosArray.length);
    
    // Crear índice de pagos por cuentaId para acceso rápido
    const pagosPorCuenta = pagosArray.reduce((acc, pago) => {
      if (!acc[pago.cuentaId]) {
        acc[pago.cuentaId] = [];
      }
      acc[pago.cuentaId].push(pago);
      return acc;
    }, {});
    
    // Lista de categorías válidas
    const categoriasValidas = ['Luz', 'Agua', 'Gas', 'Internet', 'Utiles de Aseo', 'Otros'];
    
    // Procesar cada cuenta
    return cuentasArray.map(cuenta => {
      // Encontrar pagos asociados a esta cuenta
      const pagosCuenta = pagosPorCuenta[cuenta.id] || [];
      
      // Calcular total pagado
      const totalPagado = pagosCuenta.reduce((sum, pago) => {
        const montoPago = parseFloat(pago.montoPagado) || 0;
        return sum + montoPago;
      }, 0);
      
      // Determinar si está pagada (el total pagado es mayor o igual al monto)
      const montoCuenta = parseFloat(cuenta.monto) || 0;
      const estaPagada = totalPagado >= montoCuenta;
      
      // Obtener fecha del último pago
      const fechaUltimoPago = pagosCuenta.length > 0 
        ? new Date(Math.max(...pagosCuenta.map(p => new Date(p.fechaPago).getTime())))
        : null;
        
      // Normalizar categoría
      let categoria = cuenta.categoria || 'Otros';
      
      // Asegurar que la categoría sea una de las válidas
      // Primero, buscar coincidencia exacta (case-insensitive)
      const categoriaExacta = categoriasValidas.find(
        cat => cat.toLowerCase() === categoria.toLowerCase()
      );
      
      if (categoriaExacta) {
        // Usar la versión "oficial" del nombre (con mayúsculas correctas)
        categoria = categoriaExacta;
      } else {
        // Si no hay coincidencia, mapear antiguas o usar "Otros"
        const mapeoCategoriasAntiguas = {
          'servicios': 'Luz',
          'alimentos': 'Agua',
          'transporte': 'Gas',
          'entretenimiento': 'Internet',
          'salud': 'Utiles de Aseo',
          'educacion': 'Otros',
          'otros': 'Otros'
        };
        
        categoria = mapeoCategoriasAntiguas[categoria.toLowerCase()] || 'Otros';
      }
      
      // Datos para depuración
      if (categoria === 'Internet') {
        console.log("Procesando cuenta de Internet:", cuenta);
        console.log("Pagos encontrados:", pagosCuenta.length);
        console.log("Total pagado:", totalPagado, "de", montoCuenta);
        console.log("¿Está pagada?", estaPagada);
      }
      
      return {
        ...cuenta,
        totalPagado,
        estaPagada,
        porcentajePagado: montoCuenta > 0 ? Math.min(100, Math.round((totalPagado / montoCuenta) * 100)) : 0,
        fechaUltimoPago: fechaUltimoPago ? fechaUltimoPago.toISOString() : null,
        pagosCuenta,
        categoria
      };
    });
  };
  
  // Filtrar cuentas según criterios seleccionados
  const filtrarCuentas = (cuentasProcesadas) => {
    console.log("Filtrando cuentas:", cuentasProcesadas.length);
    
    return cuentasProcesadas.filter(cuenta => {
      // Verificar si la cuenta tiene categoría para depuración
      const categoriaLowerCase = cuenta.categoria.toLowerCase();
      const filtroLowerCase = filtroCategoria.toLowerCase();
      
      if (categoriaLowerCase === 'internet') {
        console.log("Filtrando cuenta Internet:", cuenta);
        console.log("Filtro aplicado - Categoría:", filtroCategoria === 'todas' || categoriaLowerCase === filtroLowerCase);
        console.log("Filtro aplicado - Estado:", filtroEstado === 'todos' || 
          (filtroEstado === 'pagadas' && cuenta.estaPagada) || 
          (filtroEstado === 'pendientes' && !cuenta.estaPagada));
      }
      
      // Filtro por fechas (convertir a objetos Date para comparación consistente)
      if (filtroFechaInicio && cuenta.fechaVencimiento) {
        const fechaInicio = new Date(filtroFechaInicio);
        const fechaVencimiento = new Date(cuenta.fechaVencimiento);
        
        // Normalizar fechas quitando componente de tiempo
        fechaInicio.setHours(0,0,0,0);
        fechaVencimiento.setHours(0,0,0,0);
        
        if (fechaVencimiento < fechaInicio) return false;
      }
      
      if (filtroFechaFin && cuenta.fechaVencimiento) {
        const fechaFin = new Date(filtroFechaFin);
        const fechaVencimiento = new Date(cuenta.fechaVencimiento);
        
        // Normalizar fechas quitando componente de tiempo
        fechaFin.setHours(23,59,59,999);
        fechaVencimiento.setHours(23,59,59,999);
        
        if (fechaVencimiento > fechaFin) return false;
      }
      
      // Filtro por categoría (normalizar mayúsculas/minúsculas)
      if (filtroCategoria !== 'todas' && categoriaLowerCase !== filtroLowerCase) {
        return false;
      }
      
      // Filtro por estado (mejorar detección de cuenta pagada)
      if (filtroEstado === 'pagadas' && !cuenta.estaPagada) {
        return false;
      }
      
      if (filtroEstado === 'pendientes' && cuenta.estaPagada) {
        return false;
      }
      
      return true;
    });
  };
  
  // Agrupar datos según modo de visualización
  const agruparDatos = (cuentasFiltradas, modo) => {
    console.log("Agrupando datos por:", modo);
    
    // Resultados de agrupación
    const porMes = [];
    const porCategoria = [];
    const porPeriodo = [];
    
    // 1. Agrupación por mes
    const mesesMap = cuentasFiltradas.reduce((acc, cuenta) => {
      if (!cuenta.fechaVencimiento) return acc;
      
      const fecha = new Date(cuenta.fechaVencimiento);
      const periodoKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[periodoKey]) {
        acc[periodoKey] = {
          periodo: periodoKey,
          etiqueta: formatoMes(periodoKey),
          totalCuentas: 0,
          totalMonto: 0,
          cuentasPagadas: 0,
          montoPagado: 0,
          porcentajePagado: 0,
          cuentas: []
        };
      }
      
      acc[periodoKey].totalCuentas++;
      acc[periodoKey].totalMonto += parseFloat(cuenta.monto) || 0;
      
      if (cuenta.estaPagada) {
        acc[periodoKey].cuentasPagadas++;
      }
      
      acc[periodoKey].montoPagado += parseFloat(cuenta.totalPagado) || 0;
      acc[periodoKey].cuentas.push(cuenta);
      
      return acc;
    }, {});
    
    // Calcular porcentajes y ordenar
    Object.values(mesesMap).forEach(mes => {
      mes.porcentajePagado = mes.totalMonto > 0 
        ? Math.round((mes.montoPagado / mes.totalMonto) * 100) 
        : 0;
      porMes.push(mes);
    });
    
    // Ordenar por fecha (más reciente primero)
    porMes.sort((a, b) => b.periodo.localeCompare(a.periodo));
    
    // 2. Agrupación por categoría
    const categoriasMap = cuentasFiltradas.reduce((acc, cuenta) => {
      const categoriaKey = cuenta.categoria || 'Sin categoría';
      
      if (!acc[categoriaKey]) {
        acc[categoriaKey] = {
          categoria: categoriaKey,
          totalCuentas: 0,
          totalMonto: 0,
          cuentasPagadas: 0,
          montoPagado: 0,
          porcentajePagado: 0,
          cuentas: []
        };
      }
      
      acc[categoriaKey].totalCuentas++;
      acc[categoriaKey].totalMonto += parseFloat(cuenta.monto) || 0;
      
      if (cuenta.estaPagada) {
        acc[categoriaKey].cuentasPagadas++;
      }
      
      acc[categoriaKey].montoPagado += parseFloat(cuenta.totalPagado) || 0;
      acc[categoriaKey].cuentas.push(cuenta);
      
      return acc;
    }, {});
    
    // Calcular porcentajes y ordenar
    Object.values(categoriasMap).forEach(cat => {
      cat.porcentajePagado = cat.totalMonto > 0 
        ? Math.round((cat.montoPagado / cat.totalMonto) * 100) 
        : 0;
      porCategoria.push(cat);
    });
    
    // Ordenar por monto (mayor primero)
    porCategoria.sort((a, b) => b.totalMonto - a.totalMonto);
    
    // 3. Vista por períodos según modo seleccionado
    // Usar los resultados ya calculados
    if (modo === 'mes') {
      porPeriodo.push(...porMes);
    } else if (modo === 'categoria') {
      porPeriodo.push(...porCategoria);
    }
    
    return { porMes, porCategoria, porPeriodo };
  };
  
  // Generar datos para gráficos
  const datosPorCategoria = useMemo(() => {
    if (!datosAgrupados.porCategoria || datosAgrupados.porCategoria.length === 0) {
      return {};
    }
    
    // Colores para las categorías
    const colores = {
      'Luz': '#f39c12', // Amarillo
      'Agua': '#3498db', // Azul
      'Gas': '#e74c3c', // Rojo
      'Internet': '#9b59b6', // Morado
      'Utiles de Aseo': '#2ecc71', // Verde
      'Otros': '#95a5a6', // Gris
      'Sin categoría': '#7f8c8d' // Gris oscuro
    };
    
    // Preparar datos para gráfico de dona
    return {
      labels: datosAgrupados.porCategoria.map(cat => cat.categoria),
      datasets: [{
        data: datosAgrupados.porCategoria.map(cat => cat.totalMonto),
        backgroundColor: datosAgrupados.porCategoria.map(cat => colores[cat.categoria] || '#999'),
        borderWidth: 1
      }]
    };
  }, [datosAgrupados.porCategoria]);
  
  // Generar datos de tendencias por mes
  const datosTendencias = useMemo(() => {
    if (!datosAgrupados.porMes || datosAgrupados.porMes.length < 2) {
      return {};
    }
    
    // Tomar los últimos 6 meses o menos si no hay suficientes datos
    const mesesRecientes = [...datosAgrupados.porMes].reverse().slice(0, 6).reverse();
    
    return {
      labels: mesesRecientes.map(mes => mes.etiqueta),
      datasets: [{
        label: 'Monto Total',
        data: mesesRecientes.map(mes => mes.totalMonto),
        backgroundColor: 'rgba(52, 152, 219, 0.7)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 1
      }, {
        label: 'Monto Pagado',
        data: mesesRecientes.map(mes => mes.montoPagado),
        backgroundColor: 'rgba(46, 204, 113, 0.7)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 1
      }]
    };
  }, [datosAgrupados.porMes]);
  
  // Calcular resumen general
  const resumenGeneral = useMemo(() => {
    const totalCuentas = cuentas.length;
    const totalMonto = cuentas.reduce((sum, cuenta) => sum + (parseFloat(cuenta.monto) || 0), 0);
    const totalPagado = cuentas.reduce((sum, cuenta) => sum + (parseFloat(cuenta.totalPagado) || 0), 0);
    const cuentasPagadas = cuentas.filter(cuenta => cuenta.estaPagada).length;
    
    return {
      totalCuentas,
      totalMonto,
      totalPagado,
      cuentasPagadas,
      porcentajePagado: totalMonto > 0 ? Math.round((totalPagado / totalMonto) * 100) : 0
    };
  }, [cuentas]);
  
  // Seleccionar un período para ver detalles
  const seleccionarPeriodo = (periodo) => {
    if (periodoSeleccionado === periodo) {
      setPeriodoSeleccionado(null); // Colapsar si ya está seleccionado
    } else {
      setPeriodoSeleccionado(periodo);
    }
  };
  
  // Formatear fechas y montos
  const formatoFecha = (fechaStr) => {
    if (!fechaStr) return 'Sin fecha';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES');
  };
  
  const formatoMes = (periodoStr) => {
    if (!periodoStr) return '';
    
    const [año, mes] = periodoStr.split('-');
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return `${meses[parseInt(mes) - 1]} ${año}`;
  };
  
  const formatMonto = (monto) => {
    return monto ? `$${monto.toLocaleString('es-CL')}` : '$0';
  };
  
  // Exportar a CSV
  const exportarCSV = () => {
    // Crear cabeceras
    const cabeceras = ['Nombre', 'Categoría', 'Monto', 'Pagado', '% Pagado', 'Vencimiento', 'Estado'];
    
    // Preparar filas de datos
    const filas = cuentas.map(cuenta => [
      cuenta.nombre,
      cuenta.categoria,
      cuenta.monto,
      cuenta.totalPagado || 0,
      `${cuenta.porcentajePagado}%`,
      cuenta.fechaVencimiento ? formatoFecha(cuenta.fechaVencimiento) : 'Sin fecha',
      cuenta.estaPagada ? 'Pagada' : 'Pendiente'
    ]);
    
    // Unir todo en formato CSV
    const contenidoCSV = [
      cabeceras.join(','),
      ...filas.map(fila => fila.join(','))
    ].join('\n');
    
    // Crear blob y descargar
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_cuentas_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Renderizar filtros
  const renderFiltros = () => (
    <div className="filtros-container">
      <h3>Filtros</h3>
      <div className="filtros-grid">
        <div className="filtro-group">
          <label htmlFor="fecha-inicio">Desde:</label>
          <input
            type="date"
            id="fecha-inicio"
            value={filtroFechaInicio}
            onChange={(e) => setFiltroFechaInicio(e.target.value)}
          />
        </div>
        
        <div className="filtro-group">
          <label htmlFor="fecha-fin">Hasta:</label>
          <input
            type="date"
            id="fecha-fin"
            value={filtroFechaFin}
            onChange={(e) => setFiltroFechaFin(e.target.value)}
          />
        </div>
        
        <div className="filtro-group">
          <label htmlFor="categoria">Categoría:</label>
          <select
            id="categoria"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="todas">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.id || cat.nombre} value={cat.nombre}>{cat.nombre}</option>
            ))}
          </select>
        </div>
        
        <div className="filtro-group">
          <label htmlFor="estado">Estado:</label>
          <select
            id="estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pagadas">Pagadas</option>
            <option value="pendientes">Pendientes</option>
          </select>
        </div>
      </div>
      
      <div className="agrupacion-container">
        <span>Agrupar por:</span>
        <div className="agrupacion-buttons">
          <button
            type="button"
            className={agrupacion === 'mes' ? 'active' : ''}
            onClick={() => setAgrupacion('mes')}
          >
            Mes
          </button>
          <button
            type="button"
            className={agrupacion === 'categoria' ? 'active' : ''}
            onClick={() => setAgrupacion('categoria')}
          >
            Categoría
          </button>
        </div>
      </div>
      
      <a 
        href="#" 
        className="export-button" 
        onClick={(e) => { e.preventDefault(); exportarCSV(); }}
      >
        Exportar a CSV
      </a>
    </div>
  );
  
  // Renderizar resumen
  const renderResumen = () => (
    <div className="resumen-container">
      <h3>Resumen General</h3>
      <div className="resumen-cards">
        <div className="resumen-card">
          <div className="card-icon total-icon">📊</div>
          <div className="card-content">
            <div className="card-title">Total de Cuentas</div>
            <div className="card-value">{resumenGeneral.totalCuentas}</div>
          </div>
        </div>
        
        <div className="resumen-card">
          <div className="card-icon monto-icon">💰</div>
          <div className="card-content">
            <div className="card-title">Monto Total</div>
            <div className="card-value">{formatMonto(resumenGeneral.totalMonto)}</div>
          </div>
        </div>
        
        <div className="resumen-card">
          <div className="card-icon pagado-icon">✅</div>
          <div className="card-content">
            <div className="card-title">Total Pagado</div>
            <div className="card-value">{formatMonto(resumenGeneral.totalPagado)}</div>
          </div>
        </div>
        
        <div className="resumen-card">
          <div className="card-icon progreso-icon">📈</div>
          <div className="card-content">
            <div className="card-title">Porcentaje Pagado</div>
            <div className="card-value">{resumenGeneral.porcentajePagado}%</div>
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{width: `${resumenGeneral.porcentajePagado}%`}}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Renderizar gráficos
  const renderGraficos = () => (
    <div className="graficos-container">
      <div className="grafico-card">
        <h3>Distribución por Categoría</h3>
        {datosPorCategoria.labels?.length > 0 ? (
          <div className="grafico-dona">
            <Doughnut 
              data={datosPorCategoria}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      boxWidth: 15,
                      padding: 15
                    }
                  }
                }
              }}
            />
          </div>
        ) : (
          <div className="no-data">No hay suficientes datos para mostrar el gráfico</div>
        )}
      </div>
      
      <div className="grafico-card">
        <h3>Tendencia por Mes</h3>
        {datosTendencias.labels?.length > 0 ? (
          <div className="grafico-barras">
            <Bar 
              data={datosTendencias}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top'
                  },
                  title: {
                    display: true,
                    text: 'Evolución de pagos por mes'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        ) : (
          <div className="no-data">No hay suficientes datos para mostrar el gráfico</div>
        )}
      </div>
    </div>
  );
  
  // Renderizar interpretación
  const renderInterpretacion = () => (
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
      
      {datosAgrupados.porMes.length > 1 && (
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
                  <td>{Math.round((cat.totalMonto / resumenGeneral.totalMonto) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
  
  // Renderizar períodos
  const renderPeriodos = () => (
    <div className="periodos-container">
      <h3>Períodos {datosAgrupados.porPeriodo.length > 0 ? `(${datosAgrupados.porPeriodo.length})` : ''}</h3>
      {datosAgrupados.porPeriodo.length === 0 ? (
        <div className="empty-periodos">
          <p>No hay datos para los filtros seleccionados</p>
          <button 
            className="retry-button"
            onClick={() => {
              // Restablecer filtros a valores por defecto
              const fechaFin = new Date();
              const fechaInicio = new Date();
              fechaInicio.setMonth(fechaInicio.getMonth() - 6);
              
              setFiltroFechaInicio(fechaInicio.toISOString().split('T')[0]);
              setFiltroFechaFin(fechaFin.toISOString().split('T')[0]);
              setFiltroCategoria('todas');
              setFiltroEstado('todos');
            }}
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
  
  return (
    <div className="historial-page">
      <NavBar />
      <div className="historial-container">
        <div className="historial-header">
          <h2>Historial de Cuentas</h2>
          <button 
            className="refresh-button"
            onClick={() => setRefreshCounter(prev => prev + 1)}
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar datos'}
          </button>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button 
              className="retry-button"
              onClick={() => setRefreshCounter(prev => prev + 1)}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="historial-content">
            {renderFiltros()}
            {renderResumen()}
            {renderGraficos()}
            {renderInterpretacion()}
            {renderPeriodos()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Historial;
