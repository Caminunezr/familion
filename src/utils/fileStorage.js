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
          type: file.type,
          data: event.target.result,
          directory,
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
    reader.readAsArrayBuffer(file);
  });
};

// Función para leer un archivo
const getFile = async (fileId) => {
  try {
    const file = await db.archivos.get(parseInt(fileId));
    return file;
  } catch (error) {
    console.error('Error al obtener archivo:', error);
    throw error;
  }
};

export { saveFile, getFile };
