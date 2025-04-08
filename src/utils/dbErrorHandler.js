/**
 * Manejador centralizado de errores de base de datos
 */

// Tipos de errores comunes
export const DB_ERROR_TYPES = {
  CONNECTION: 'CONNECTION_ERROR',
  CONSTRAINT: 'CONSTRAINT_ERROR',
  QUOTA: 'QUOTA_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  STORAGE_FULL: 'STORAGE_FULL_ERROR'
};

/**
 * Clasifica y maneja errores de base de datos
 * @param {Error} error - Error original
 * @param {Object} context - Contexto adicional del error
 * @returns {Object} Error procesado con tipo y mensaje user-friendly
 */
export const handleDbError = (error, context = {}) => {
  const errorMsg = error.message || '';
  let errorType = DB_ERROR_TYPES.UNKNOWN;
  let userMessage = 'Ocurrió un error en la base de datos.';
  
  if (errorMsg.includes('quota') || errorMsg.includes('storage') || errorMsg.includes('full')) {
    errorType = DB_ERROR_TYPES.STORAGE_FULL;
    userMessage = 'El almacenamiento está lleno. Por favor, libera espacio eliminando datos innecesarios.';
  } 
  else if (errorMsg.includes('constraint') || errorMsg.includes('duplicate')) {
    errorType = DB_ERROR_TYPES.CONSTRAINT;
    userMessage = 'Ya existe un registro con esos datos.';
  }
  else if (errorMsg.includes('not found') || errorMsg.includes('no existe') || error.name === 'NotFoundError') {
    errorType = DB_ERROR_TYPES.NOT_FOUND;
    userMessage = 'El registro solicitado no fue encontrado.';
  }
  else if (errorMsg.includes('connection') || errorMsg.includes('network') || errorMsg.includes('conexión')) {
    errorType = DB_ERROR_TYPES.CONNECTION;
    userMessage = 'Problema de conexión. Verifica tu red.';
  }
  else if (errorMsg.includes('validation') || errorMsg.includes('invalid')) {
    errorType = DB_ERROR_TYPES.VALIDATION;
    userMessage = 'Los datos no cumplen con los requisitos de validación.';
  }
  
  // Si hay información de contexto, personalizar el mensaje
  if (context.entity) {
    if (errorType === DB_ERROR_TYPES.NOT_FOUND) {
      userMessage = `No se encontró ${context.entity}.`;
    } else if (errorType === DB_ERROR_TYPES.CONSTRAINT) {
      userMessage = `No se puede ${context.action || 'procesar'} ${context.entity} debido a restricciones de datos.`;
    }
  }
  
  return {
    originalError: error,
    type: errorType,
    message: userMessage,
    context,
    timestamp: new Date().toISOString()
  };
};

/**
 * Registra errores de base de datos para análisis
 * @param {Object} processedError - Error procesado por handleDbError
 */
export const logDbError = (processedError) => {
  // En producción, esto podría enviar el error a un servicio de monitoreo
  console.error("Error de base de datos:", processedError.message, {
    tipo: processedError.type,
    timestamp: processedError.timestamp,
    contexto: processedError.context,
    errorOriginal: processedError.originalError
  });
  
  // Guardar en localStorage para diagnostico
  try {
    const erroresAnteriores = JSON.parse(localStorage.getItem('familion_db_errors') || '[]');
    erroresAnteriores.push({
      message: processedError.message,
      type: processedError.type,
      timestamp: processedError.timestamp,
      context: processedError.context
    });
    
    // Mantener solo los últimos 10 errores
    if (erroresAnteriores.length > 10) {
      erroresAnteriores.shift();
    }
    
    localStorage.setItem('familion_db_errors', JSON.stringify(erroresAnteriores));
  } catch (e) {
    console.error("Error al guardar log de errores:", e);
  }
};

/**
 * Envuelve una función de base de datos con manejo de errores
 * @param {Function} dbOperation - Función que realiza operación de DB
 * @param {Object} context - Contexto para el error
 * @returns {Function} Función envuelta con manejo de errores
 */
export const withErrorHandling = (dbOperation, context = {}) => {
  return async (...args) => {
    try {
      return await dbOperation(...args);
    } catch (error) {
      const processedError = handleDbError(error, context);
      logDbError(processedError);
      throw processedError;
    }
  };
};

export default {
  handleDbError,
  logDbError,
  withErrorHandling,
  DB_ERROR_TYPES
};
