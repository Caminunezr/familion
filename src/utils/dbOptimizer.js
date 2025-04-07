import db from './database';
import fileDB from './fileStorage';

/**
 * Conjunto de utilidades para optimizar el rendimiento de las bases de datos Dexie
 */

/**
 * Compacta la base de datos para recuperar espacio
 * @returns {Promise<Object>} - Resultado de la compactación
 */
export const compactDatabases = async () => {
  try {
    const results = {
      main: await db.compact(),
      files: await fileDB.compact()
    };
    
    console.log('Bases de datos compactadas:', results);
    return results;
  } catch (error) {
    console.error('Error al compactar bases de datos:', error);
    throw error;
  }
};

/**
 * Limpia archivos temporales o huérfanos
 * @returns {Promise<number>} - Número de archivos eliminados
 */
export const cleanupOrphanedFiles = async () => {
  let deletedCount = 0;
  
  try {
    // Buscar fragmentos huérfanos (sin archivo padre)
    const orphanedChunks = await fileDB.files
      .filter(file => file.parentId && !file.name)
      .toArray();
      
    // Conjunto de IDs de archivos padres existentes
    const parentIds = new Set(
      (await fileDB.files.filter(f => !f.parentId).toArray()).map(f => f.id)
    );
    
    // Filtrar fragmentos verdaderamente huérfanos
    const reallyOrphaned = orphanedChunks.filter(chunk => !parentIds.has(chunk.parentId));
    
    // Eliminar fragmentos huérfanos
    for (const chunk of reallyOrphaned) {
      await fileDB.files.delete(chunk.id);
      deletedCount++;
    }
    
    console.log(`Limpieza completada: ${deletedCount} archivos huérfanos eliminados`);
    return deletedCount;
  } catch (error) {
    console.error('Error en la limpieza de archivos huérfanos:', error);
    throw error;
  }
};

/**
 * Optimiza índices de la base de datos
 * @returns {Promise<void>}
 */
export const optimizeIndexes = async () => {
  try {
    // Mejorar rendimiento de los índices
    await Promise.all([
      db.cuentas.orderBy('id').toArray(),
      db.cuentas.orderBy('userId').toArray(),
      db.presupuestos.orderBy('id').toArray(),
      db.pagos.orderBy('id').toArray(),
      fileDB.files.orderBy('id').toArray()
    ]);
    
    console.log('Índices optimizados');
  } catch (error) {
    console.error('Error al optimizar índices:', error);
    throw error;
  }
};

/**
 * Realiza una optimización completa de las bases de datos
 * @returns {Promise<Object>} - Resultados de la optimización
 */
export const performFullOptimization = async () => {
  try {
    const results = {
      orphanedFilesRemoved: await cleanupOrphanedFiles()
    };
    
    await optimizeIndexes();
    const compactionResult = await compactDatabases();
    
    return {
      ...results,
      compactionResult
    };
  } catch (error) {
    console.error('Error en la optimización completa:', error);
    throw error;
  }
};

export default {
  compactDatabases,
  cleanupOrphanedFiles,
  optimizeIndexes,
  performFullOptimization
};
