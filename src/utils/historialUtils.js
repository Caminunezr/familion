// (Importar utilidades necesarias como categoryUtils, formatoFecha, etc.)

// Lista de categorías válidas (podría venir de categoryUtils)
const CATEGORIAS_VALIDAS = ['Luz', 'Agua', 'Gas', 'Internet', 'Utiles de Aseo', 'Otros'];

// Mapeo de categorías antiguas (podría venir de categoryUtils)
const MAPEO_CATEGORIAS_ANTIGUAS = {
  'servicios': 'Luz',
  'alimentos': 'Agua',
  'transporte': 'Gas',
  'entretenimiento': 'Internet',
  'salud': 'Utiles de Aseo',
  'educacion': 'Otros',
  'otros': 'Otros'
};

function normalizarCategoria(categoriaNombre) {
  let categoria = categoriaNombre || 'Otros';
  const categoriaExacta = CATEGORIAS_VALIDAS.find(
    cat => cat.toLowerCase() === categoria.toLowerCase()
  );
  if (categoriaExacta) {
    return categoriaExacta;
  } else {
    return MAPEO_CATEGORIAS_ANTIGUAS[categoria.toLowerCase()] || 'Otros';
  }
}

export function procesarCuentasYPagosHistorial(cuentasArray, pagosArray) {
  console.log("Procesando cuentas y pagos (historialUtils):", cuentasArray.length, pagosArray.length);
  const pagosPorCuenta = pagosArray.reduce((acc, pago) => {
    if (!acc[pago.cuentaId]) {
      acc[pago.cuentaId] = [];
    }
    acc[pago.cuentaId].push(pago);
    return acc;
  }, {});

  return cuentasArray.map(cuenta => {
    const pagosCuenta = (pagosPorCuenta[cuenta.id] || []).map(pago => ({
      ...pago,
      rutaComprobante: pago.rutaComprobante || pago.comprobanteUrl || null
    }));
    const totalPagado = pagosCuenta.reduce((sum, pago) => sum + (parseFloat(pago.montoPagado) || 0), 0);
    const montoCuenta = parseFloat(cuenta.monto) || 0;
    const estaPagada = totalPagado >= montoCuenta;
    const fechaUltimoPago = pagosCuenta.length > 0
      ? new Date(Math.max(...pagosCuenta.map(p => new Date(p.fechaPago).getTime())))
      : null;
    const categoriaNormalizada = normalizarCategoria(cuenta.categoria);

    return {
      ...cuenta,
      totalPagado,
      estaPagada,
      porcentajePagado: montoCuenta > 0 ? Math.min(100, Math.round((totalPagado / montoCuenta) * 100)) : 0,
      fechaUltimoPago: fechaUltimoPago ? fechaUltimoPago.toISOString() : null,
      pagosCuenta,
      categoria: categoriaNormalizada
    };
  });
}

export function filtrarCuentasHistorial(cuentasProcesadas, filtros) {
  const { filtroFechaInicio, filtroFechaFin, filtroCategoria, filtroEstado } = filtros;
  console.log("Filtrando cuentas (historialUtils):", cuentasProcesadas.length);

  return cuentasProcesadas.filter(cuenta => {
    const categoriaLowerCase = cuenta.categoria.toLowerCase();
    const filtroCatLowerCase = filtroCategoria.toLowerCase();

    // Filtro por fechas
    if (filtroFechaInicio && cuenta.fechaVencimiento) {
      const fechaInicio = new Date(filtroFechaInicio);
      const fechaVencimiento = new Date(cuenta.fechaVencimiento);
      fechaInicio.setHours(0,0,0,0);
      fechaVencimiento.setHours(0,0,0,0);
      if (fechaVencimiento < fechaInicio) return false;
    }
    if (filtroFechaFin && cuenta.fechaVencimiento) {
      const fechaFin = new Date(filtroFechaFin);
      const fechaVencimiento = new Date(cuenta.fechaVencimiento);
      fechaFin.setHours(23,59,59,999);
      // Asegurarse que la fecha de vencimiento también tenga hora para comparar correctamente
      const fechaVencimientoConHora = new Date(fechaVencimiento);
      fechaVencimientoConHora.setHours(23,59,59,999);
      if (fechaVencimientoConHora > fechaFin) return false;
    }
    // Filtro por categoría
    if (filtroCategoria !== 'todas' && categoriaLowerCase !== filtroCatLowerCase) {
      return false;
    }
    // Filtro por estado
    if (filtroEstado === 'pagadas' && !cuenta.estaPagada) return false;
    if (filtroEstado === 'pendientes' && cuenta.estaPagada) return false;

    return true;
  });
}

// Nueva función para agrupar datos
export function agruparDatosHistorial(cuentasFiltradas, modo, formatoMesFunc) {
  console.log("Agrupando datos (historialUtils) por:", modo);

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
        etiqueta: formatoMesFunc(periodoKey), // Usar la función pasada como argumento
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

  Object.values(mesesMap).forEach(mes => {
    mes.porcentajePagado = mes.totalMonto > 0
      ? Math.round((mes.montoPagado / mes.totalMonto) * 100)
      : 0;
    porMes.push(mes);
  });

  porMes.sort((a, b) => b.periodo.localeCompare(a.periodo));

  // 2. Agrupación por categoría
  const categoriasMap = cuentasFiltradas.reduce((acc, cuenta) => {
    const categoriaKey = cuenta.categoria || 'Sin categoría'; // Ya normalizada en paso anterior

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

  Object.values(categoriasMap).forEach(cat => {
    cat.porcentajePagado = cat.totalMonto > 0
      ? Math.round((cat.montoPagado / cat.totalMonto) * 100)
      : 0;
    porCategoria.push(cat);
  });

  porCategoria.sort((a, b) => b.totalMonto - a.totalMonto);

  // 3. Vista por períodos según modo seleccionado
  if (modo === 'mes') {
    porPeriodo.push(...porMes);
  } else if (modo === 'categoria') {
    porPeriodo.push(...porCategoria);
  }

  return { porMes, porCategoria, porPeriodo };
}

/**
 * Placeholder para generar opciones de período basadas en fechas.
 * TODO: Implementar la lógica real para extraer años/meses de las fechas.
 * @param {string[]} fechas - Array de strings de fechas (ISO o similar).
 * @returns {Array} - Array de opciones de período (ej: [{ value: '2023-10', label: 'Oct 2023' }]).
 */
export const generarPeriodos = (fechas = []) => {
  console.warn("generarPeriodos no implementado, usando valores por defecto.");
  // Lógica temporal:
  const ahora = new Date();
  const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
  return [
    { value: 'mesActual', label: 'Mes Actual' },
    { value: 'mesAnterior', label: 'Mes Anterior' },
    { value: mesActual, label: `Específico: ${mesActual}` } // Ejemplo
  ];
};

/**
 * Placeholder para procesar todos los datos históricos filtrados y agrupados.
 * TODO: Implementar la lógica real de filtrado, agrupación y cálculo de resumen/gráficos.
 * @param {Object} datosCompletos - Objeto con arrays { cuentas, pagos, presupuestos, aportes }.
 * @param {Object} filtros - Objeto con los filtros aplicados.
 * @param {string} agrupacion - Criterio de agrupación ('categoria', 'mes').
 * @returns {Object} - Objeto con { resumen, datosGrafico, interpretacion, tablaCategorias }.
 */
export const procesarDatosHistorial = (datosCompletos, filtros, agrupacion) => {
  console.warn("procesarDatosHistorial no implementado, devolviendo datos vacíos.");
  // Lógica temporal:
  // Aquí deberías llamar a tus otras funciones (filtrarCuentasHistorial, agruparDatosHistorial, etc.)
  // y construir el objeto de resultado final.
  return {
    resumen: { /* datos de resumen calculados */ },
    datosGrafico: { /* datos formateados para Chart.js */ },
    interpretacion: [ /* strings con análisis o insights */ ],
    tablaCategorias: [ /* array con datos por categoría */ ]
  };
};
