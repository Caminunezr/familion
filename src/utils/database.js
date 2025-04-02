import Dexie from 'dexie';

// Crear base de datos IndexedDB
const db = new Dexie('familion');

db.version(1).stores({
  cuentas: '++id, nombre, proveedor, fechaVencimiento, categoria, usuarioCreacion',
  pagos: '++id, cuentaId, fechaPago, pagadoPor',
  archivos: '++id, name, directory, timestamp'
});

export default db;
