import Dexie from 'dexie';

// Base de datos específica para archivos
const fileDB = new Dexie('familionFilesDB');

// Definir esquema para almacenamiento de archivos
fileDB.version(1).stores({
  files: '++id, name, type, size, directory, dateAdded'
});

// Versión 2: Añadir índices para búsqueda rápida por directorio
fileDB.version(2).stores({
  files: '++id, name, type, size, directory, dateAdded, [directory+dateAdded]'
});

const MAX_CHUNK_SIZE = 1024 * 1024 * 2; // 2MB por fragmento

/**
 * Divide un archivo grande en fragmentos manejables
 * @param {ArrayBuffer} buffer - Datos del archivo
 * @returns {ArrayBuffer[]} - Array de fragmentos
 */
const chunkifyFile = (buffer) => {
  const chunks = [];
  let offset = 0;

  while (offset < buffer.byteLength) {
    const size = Math.min(MAX_CHUNK_SIZE, buffer.byteLength - offset);
    chunks.push(buffer.slice(offset, offset + size));
    offset += size;
  }

  return chunks;
};

/**
 * Guarda un archivo en la base de datos
 * @param {File} file - El archivo a guardar
 * @param {string} directory - Directorio virtual para clasificar el archivo
 * @returns {Promise<string>} - Ruta de acceso al archivo guardado
 */
export const saveFile = async (file, directory = 'general') => {
  try {
    // Validación de entrada
    if (!file || !(file instanceof File)) {
      throw new Error('Se requiere un archivo válido');
    }

    // Leer el archivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Para archivos grandes, dividirlos en fragmentos y usar una transacción
    return await fileDB.transaction('rw', fileDB.files, async () => {
      // Crear registro de metadatos (sin los datos binarios)
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        directory,
        dateAdded: new Date().toISOString()
      };

      // Para archivos pequeños, guardar todo en un registro
      if (arrayBuffer.byteLength <= MAX_CHUNK_SIZE) {
        fileData.data = arrayBuffer;
        const id = await fileDB.files.add(fileData);
        return `${directory}/${id}`;
      }

      // Para archivos grandes, guardar metadatos y fragmentos por separado
      fileData.chunked = true;
      fileData.chunks = [];

      const id = await fileDB.files.add(fileData);
      const chunks = chunkifyFile(arrayBuffer);

      // Guardar cada fragmento con referencia al archivo principal
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = await fileDB.files.add({
          parentId: id,
          chunkIndex: i,
          data: chunks[i],
          dateAdded: new Date().toISOString()
        });

        await fileDB.files.update(id, {
          chunks: fileDB.files.get(id).then(f => [...(f.chunks || []), chunkId])
        });
      }

      return `${directory}/${id}`;
    });
  } catch (error) {
    console.error('Error al guardar archivo:', error);
    throw error;
  }
};

/**
 * Obtiene un archivo de la base de datos
 * @param {number} id - ID del archivo
 * @returns {Promise<Object>} - Datos del archivo
 */
export const getFile = async (id) => {
  try {
    id = parseInt(id);
    if (isNaN(id)) throw new Error('ID de archivo inválido');

    const fileData = await fileDB.files.get(id);
    if (!fileData) return null;

    // Si el archivo está dividido en fragmentos, reconstruirlo
    if (fileData.chunked && fileData.chunks && fileData.chunks.length > 0) {
      return await fileDB.transaction('r', fileDB.files, async () => {
        // Obtener todos los fragmentos
        const fragments = await Promise.all(
          fileData.chunks.map(chunkId => fileDB.files.get(chunkId))
        );

        // Ordenar fragmentos por índice
        fragments.sort((a, b) => a.chunkIndex - b.chunkIndex);

        // Calcular tamaño total
        const totalSize = fragments.reduce((sum, fragment) => sum + fragment.data.byteLength, 0);

        // Crear buffer combinado
        const combinedArray = new Uint8Array(totalSize);
        let offset = 0;

        for (const fragment of fragments) {
          const tempArray = new Uint8Array(fragment.data);
          combinedArray.set(tempArray, offset);
          offset += tempArray.byteLength;
        }

        // Devolver datos completos
        const reconstructedData = combinedArray.buffer;
        return {
          ...fileData,
          data: reconstructedData
        };
      });
    }

    return fileData;
  } catch (error) {
    console.error('Error al obtener archivo:', error);
    throw error;
  }
};

/**
 * Elimina un archivo de la base de datos
 * @param {number} id - ID del archivo a eliminar
 * @returns {Promise<void>}
 */
export const deleteFile = async (id) => {
  try {
    id = parseInt(id);
    if (isNaN(id)) throw new Error('ID de archivo inválido');

    return await fileDB.transaction('rw', fileDB.files, async () => {
      const file = await fileDB.files.get(id);
      if (!file) return;

      // Si es un archivo fragmentado, eliminar todos los fragmentos
      if (file.chunked && file.chunks && file.chunks.length > 0) {
        await Promise.all(file.chunks.map(chunkId => fileDB.files.delete(chunkId)));
      }

      // Eliminar el registro principal
      await fileDB.files.delete(id);
    });
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    throw error;
  }
};

export default fileDB;
