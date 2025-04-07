import Dexie from 'dexie';

// Crear y configurar la base de datos
const db = new Dexie('familionDB');

// Definir esquemas y versiones
db.version(1).stores({
  cuentas: '++id, userId, nombre, categoria, fechaVencimiento, estaPagada, fechaCreacion',
  pagos: '++id, cuentaId, pagadoPor, fechaPago, montoPagado',
  categorias: '++id, nombre, descripcion, color',
  presupuestos: '++id, userId, mes, categoria, montoAsignado, fechaCreacion',
  aportes: '++id, presupuestoId, miembroId, monto, fechaAporte, rutaComprobante, fechaCreacion'
});

// Versión 2: Añadir campos a presupuestos y aportes
db.version(2).stores({
  presupuestos: '++id, userId, mes, categoria, montoAsignado, fechaCreacion, montoAporte, montoObjetivo',
  aportes: '++id, presupuestoId, miembroId, monto, fechaAporte, rutaComprobante, fechaCreacion, tipoPago, cuentaId, cuentaNombre, pagoId'
}).upgrade(tx => {
  // Esta función se ejecutará cuando se actualice de v1 a v2
  return tx.presupuestos.toCollection().modify(presupuesto => {
    // Asignar valores predeterminados a los nuevos campos
    if (!presupuesto.montoAporte && presupuesto.montoObjetivo) {
      presupuesto.montoAporte = presupuesto.montoObjetivo;
    } else if (!presupuesto.montoAporte) {
      presupuesto.montoAporte = 0;
    }

    if (!presupuesto.montoObjetivo) {
      presupuesto.montoObjetivo = presupuesto.montoAsignado || 0;
    }
  });
});

// Añadir índices adicionales para mejorar el rendimiento de consultas frecuentes
db.version(3).stores({
  cuentas: '++id, userId, nombre, categoria, fechaVencimiento, estaPagada, fechaCreacion, [userId+estaPagada], [userId+categoria]',
  pagos: '++id, cuentaId, pagadoPor, fechaPago, montoPagado, [cuentaId+pagadoPor]',
  presupuestos: '++id, userId, mes, categoria, montoAsignado, fechaCreacion, montoAporte, montoObjetivo, [userId+mes]'
});

// Inicializar categorías por defecto si la tabla está vacía
db.on('ready', async () => {
  const categoriaCount = await db.categorias.count();

  if (categoriaCount === 0) {
    // Nuevas categorías predeterminadas
    const categoriasDefault = [
      { nombre: 'Luz', descripcion: 'Gastos de electricidad', color: '#f39c12' },
      { nombre: 'Agua', descripcion: 'Gastos de agua potable', color: '#3498db' },
      { nombre: 'Gas', descripcion: 'Gastos de gas doméstico', color: '#e74c3c' },
      { nombre: 'Internet', descripcion: 'Gastos de conexión a internet', color: '#9b59b6' },
      { nombre: 'Utiles de Aseo', descripcion: 'Gastos en productos de limpieza', color: '#2ecc71' },
      { nombre: 'Otros', descripcion: 'Otros gastos no categorizados', color: '#95a5a6' }
    ];
    await db.categorias.bulkAdd(categoriasDefault);
  }
});

export default db;