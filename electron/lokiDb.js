const path = require('path');
const Loki = require('lokijs');

const dbPath = path.join(__dirname, '../../archivosFamilia/familia-loki.json');

// Inicializa la base de datos LokiJS con autoload y autosave
const db = new Loki(dbPath, {
  autoload: true,
  autoloadCallback: databaseInitialize,
  autosave: true,
  autosaveInterval: 4000 // cada 4 segundos
});

function databaseInitialize() {
  if (!db.getCollection('archivos')) {
    db.addCollection('archivos', { indices: ['cuentaId', 'tipo', 'fechaRegistro'] });
  }
}

function getArchivos() {
  return db.getCollection('archivos').find();
}

function getArchivosPorCuenta(cuentaId) {
  return db.getCollection('archivos').find({ cuentaId });
}

function addArchivo(archivo) {
  return db.getCollection('archivos').insert({
    ...archivo,
    fechaRegistro: archivo.fechaRegistro || new Date().toISOString()
  });
}

function updateArchivo(id, data) {
  const archivos = db.getCollection('archivos');
  const archivo = archivos.get(id);
  if (archivo) {
    Object.assign(archivo, data);
    archivos.update(archivo);
    return archivo;
  }
  return null;
}

function removeArchivo(id) {
  const archivos = db.getCollection('archivos');
  const archivo = archivos.get(id);
  if (archivo) {
    archivos.remove(archivo);
    return true;
  }
  return false;
}

module.exports = {
  db,
  getArchivos,
  getArchivosPorCuenta,
  addArchivo,
  updateArchivo,
  removeArchivo
};
