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
    console.log("Optimizando índices de base de datos...");
    
    // Para la base de datos principal
    await db.cuentas.toCollection().modify(cuenta => {
      // Asegurarse de que todos los registros tienen los campos necesarios
      if (!cuenta.fechaCreacion) cuenta.fechaCreacion = new Date().toISOString();
      if (cuenta.categoria === undefined) cuenta.categoria = 'Otros';
      
      // Normalizar categorías para mejorar búsqueda por índice
      if (cuenta.categoria) {
        const categoriasMapping = {
          'servicios': 'Luz',
          'alimentos': 'Agua',
          'transporte': 'Gas',
          'entretenimiento': 'Internet',
          'salud': 'Utiles de Aseo',
          'educacion': 'Otros',
          'otros': 'Otros'
        };
        
        const categoriaLower = cuenta.categoria.toLowerCase();
        if (categoriasMapping[categoriaLower]) {
          cuenta.categoria = categoriasMapping[categoriaLower];
        }
      }
    });
    
    console.log("Índices optimizados correctamente");
  } catch (error) {
    console.error("Error al optimizar índices:", error);
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
