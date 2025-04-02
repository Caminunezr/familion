import Dexie from 'dexie';

// Crear y configurar la base de datos
const db = new Dexie('familionDB');

// Definir esquemas de tablas (versión 1)
db.version(1).stores({
  // Tabla de cuentas: almacena información de las cuentas a pagar
  cuentas: '++id, userId, nombre, categoria, fechaVencimiento, estaPagada, fechaCreacion',
  
  // Tabla de pagos: registra pagos realizados a las cuentas
  pagos: '++id, cuentaId, pagadoPor, fechaPago, montoPagado',
  
  // Tabla de categorías: almacena las categorías disponibles
  categorias: '++id, nombre, descripcion, color',
  
  // Tabla de presupuestos: almacena presupuestos mensuales
  presupuestos: '++id, userId, mes, categoria, montoAsignado, fechaCreacion',
  
  // Tabla de aportes: registra aportes a los presupuestos
  aportes: '++id, presupuestoId, miembroId, monto, fechaAporte, cuentaId'
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
      { nombre: 'otros', descripcion: 'Otros gastos no categorizados', color: '#95a5a6' }
    ];
    
    // Agregar las categorías a la base de datos
    await db.categorias.bulkAdd(categoriasDefault);
    console.log('Categorías por defecto inicializadas');
  }
});

// Manejo de errores
db.open().catch(err => {
  console.error('Error al abrir la base de datos:', err);
});

export default db;
