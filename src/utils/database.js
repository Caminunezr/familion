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
    // Si no hay categorías, crear las categorías por defecto
    const categoriasDefault = [
      { nombre: 'servicios', descripcion: 'Servicios públicos y suscripciones', color: '#3498db' },
      { nombre: 'alimentos', descripcion: 'Compras de comida y supermercado', color: '#e67e22' },
      { nombre: 'transporte', descripcion: 'Gastos relacionados con transporte', color: '#2ecc71' },
      { nombre: 'entretenimiento', descripcion: 'Ocio y entretenimiento', color: '#9b59b6' },
      { nombre: 'salud', descripcion: 'Gastos médicos y de salud', color: '#e74c3c' },
      { nombre: 'educacion', descripcion: 'Gastos educativos', color: '#f1c40f' },
      { nombre: 'otros', descripcion: 'Otros gastos', color: '#34495e' }
    ];
    await db.categorias.bulkAdd(categoriasDefault);
  }
});

export default db;