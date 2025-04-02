import Dexie from 'dexie';

// Base de datos específica para archivos
const fileDB = new Dexie('familionFilesDB');

// Definir esquema para almacenamiento de archivos
fileDB.version(1).stores({
  files: '++id, name, type, size, data, directory, dateAdded'
});

/**
 * Guarda un archivo en la base de datos
 * @param {File} file - El archivo a guardar
 * @param {string} directory - Directorio virtual para clasificar el archivo
 * @returns {Promise<string>} - Ruta de acceso al archivo guardado
 */
export const saveFile = async (file, directory = 'general') => {
  try {
    // Leer el archivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Crear registro en la base de datos
    const id = await fileDB.files.add({
      name: file.name,
      type: file.type,
      size: file.size,
      data: arrayBuffer,
      directory,
      dateAdded: new Date().toISOString()
    });
    
    // Devolver una "ruta virtual" al archivo
    return `${directory}/${id}`;
  } catch (error) {
    console.error('Error al guardar archivo:', error);
    throw error;
  }
};

/**
 * Obtiene un archivo desde la base de datos
 * @param {string|number} fileId - ID del archivo a obtener
 * @returns {Promise<Object>} - Objeto con información y datos del archivo
 */
export const getFile = async (fileId) => {
  try {
    const numericId = parseInt(fileId, 10);
    if (isNaN(numericId)) {
      throw new Error('ID de archivo inválido');
    }
    
    const fileRecord = await fileDB.files.get(numericId);
    if (!fileRecord) {
      throw new Error('Archivo no encontrado');
    }
    
    return fileRecord;
  } catch (error) {
    console.error('Error al obtener archivo:', error);
    throw error;
  }
};

/**
 * Elimina un archivo de la base de datos
 * @param {string} filePath - Ruta del archivo a eliminar
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
export const deleteFile = async (filePath) => {
  try {
    if (!filePath) return false;
    
    const [directory, fileId] = filePath.split('/');
    const numericId = parseInt(fileId, 10);
    
    if (isNaN(numericId)) {
      throw new Error('Ruta de archivo inválida');
    }
    
    await fileDB.files.delete(numericId);
    return true;
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    return false;
  }
};

// Manejo de errores al abrir la base de datos
fileDB.open().catch(err => {
  console.error('Error al abrir la base de datos de archivos:', err);
});

export default fileDB;
