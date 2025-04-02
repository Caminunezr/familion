import db from './database';

// Almacenamiento de archivos usando IndexedDB
const saveFile = async (file, directory) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Guardar en IndexedDB
        const fileData = {
          name: file.name,
          type: file.type || getMimeType(file.name), // Asegurar que tengamos un tipo MIME
          data: event.target.result,  // Contenido binario del archivo
          directory,                  // 'facturas' o 'comprobantes'
          timestamp: new Date().toISOString()
        };
        
        // Agregar a la tabla archivos
        const fileId = await db.archivos.add(fileData);
        resolve(`${directory}/${fileId}`);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    // El archivo se lee como ArrayBuffer
    reader.readAsArrayBuffer(file);
  });
};

// Función para leer un archivo
const getFile = async (fileId) => {
  try {
    const id = parseInt(fileId, 10);
    if (isNaN(id)) {
      throw new Error('ID de archivo inválido');
    }
    
    const file = await db.archivos.get(id);
    
    if (!file) {
      throw new Error('Archivo no encontrado');
    }
    
    // Asegurar que hay un tipo MIME para el archivo
    if (!file.type) {
      file.type = getMimeType(file.name);
    }
    
    return file;
  } catch (error) {
    console.error('Error al obtener archivo:', error);
    throw error;
  }
};

// Función auxiliar para determinar el tipo MIME según la extensión
const getMimeType = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

export { saveFile, getFile };
