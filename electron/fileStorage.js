const path = require('path');
const fs = require('fs');
const {
  addArchivo,
  getArchivosPorCuenta
} = require('./lokiDb');

/**
 * Guarda un archivo en la carpeta local y registra la metadata en LokiJS.
 * @param {Buffer} fileBuffer - El buffer del archivo a guardar.
 * @param {Object} options - Opciones del archivo.
 * @param {string} options.tipo - 'factura' o 'comprobante'.
 * @param {string} options.cuentaId - ID de la cuenta asociada.
 * @param {string} options.nombreOriginal - Nombre original del archivo.
 * @param {string} options.familyId - ID de la familia (para la ruta).
 * @param {string} [options.infoExtra] - Info adicional opcional.
 * @returns {Object} - Metadata registrada.
 */
function guardarArchivoLocal(fileBuffer, { tipo, cuentaId, nombreOriginal, familyId, infoExtra }) {
  const extension = path.extname(nombreOriginal);
  const fechaRegistro = new Date().toISOString();
  const carpetaDestino = path.join(__dirname, `../../archivosFamilia/${familyId}/${tipo === 'factura' ? 'facturas' : 'comprobantes'}`);
  if (!fs.existsSync(carpetaDestino)) {
    fs.mkdirSync(carpetaDestino, { recursive: true });
  }
  // Nombre único para evitar colisiones
  const nombreArchivo = `${cuentaId}_${Date.now()}${extension}`;
  const rutaLocal = path.join(carpetaDestino, nombreArchivo);
  fs.writeFileSync(rutaLocal, fileBuffer);
  const size = fileBuffer.length;

  // Guardar metadata en LokiJS
  const archivo = addArchivo({
    tipo,
    cuentaId,
    nombreArchivo,
    rutaLocal,
    fechaRegistro,
    extension,
    size,
    infoExtra: infoExtra || null
  });

  return archivo;
}

/**
 * Obtiene los archivos asociados a una cuenta.
 * @param {string} cuentaId
 * @returns {Array} - Array de metadata de archivos
 */
function obtenerArchivosPorCuenta(cuentaId) {
  return getArchivosPorCuenta(cuentaId);
}

module.exports = {
  guardarArchivoLocal,
  obtenerArchivosPorCuenta
};
