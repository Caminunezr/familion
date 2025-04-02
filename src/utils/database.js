import Dexie from 'dexie';

// Crear base de datos IndexedDB
const db = new Dexie('familion');

// Definir esquema con versiones para migración
db.version(1).stores({
  cuentas: '++id, nombre, proveedor, fechaVencimiento, categoria, usuarioCreacion',
  pagos: '++id, cuentaId, fechaPago, pagadoPor',
  archivos: '++id, name, directory, timestamp'
});

// Incrementar versión para agregar nuevas tablas
db.version(2).stores({
  // Mantener tablas existentes
  cuentas: '++id, nombre, proveedor, fechaVencimiento, categoria, usuarioCreacion',
  pagos: '++id, cuentaId, fechaPago, pagadoPor',
  archivos: '++id, name, directory, timestamp',
  // Agregar nuevas tablas
  presupuestos: '++id, mes, estado, creadorId',
  aportes: '++id, presupuestoId, miembroId, fechaAporte'
});

// Función para resetear la base de datos si es necesario (uso en desarrollo)
export const resetDatabase = async () => {
  await db.delete();
  window.location.reload();
};

export default db;
