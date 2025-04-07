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
  VALIDATION: 'VALIDATION_ERROR'
};

/**
 * Clasifica y maneja errores de base de datos
 * @param {Error} error - Error original
 * @param {Object} context - Contexto adicional del error
 * @returns {Object} Error procesado con tipo y mensaje user-friendly
 */
export const handleDbError = (error, context = {}) => {
  console.error('Error de base de datos:', error, context);
  
  // Determinar tipo de error
  let errorType = DB_ERROR_TYPES.UNKNOWN;
  let userMessage = 'Ha ocurrido un error en la base de datos.';
  
  // Clasificar error por mensaje
  const errorMsg = error.message.toLowerCase();
  
  if (errorMsg.includes('quota') || errorMsg.includes('storage') || errorMsg.includes('full')) {
    errorType = DB_ERROR_TYPES.QUOTA;
    userMessage = 'Se ha excedido el límite de almacenamiento. Intenta liberar espacio eliminando datos innecesarios.';
  } 
  else if (errorMsg.includes('constraint') || errorMsg.includes('duplicate')) {
    errorType = DB_ERROR_TYPES.CONSTRAINT;
    userMessage = 'No se puede realizar la operación debido a restricciones de datos.';
  }
  else if (errorMsg.includes('not found') || errorMsg.includes('no existe') || error.name === 'NotFoundError') {
    errorType = DB_ERROR_TYPES.NOT_FOUND;
    userMessage = 'No se encontró el elemento solicitado.';
  }
  else if (errorMsg.includes('connection') || errorMsg.includes('network') || errorMsg.includes('conexión')) {
    errorType = DB_ERROR_TYPES.CONNECTION;
    userMessage = 'Problema de conexión con la base de datos. Verifica tu conexión.';
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
  console.error('DB Error:', processedError);
  
  // Almacenar en localStorage para referencia
  try {
    const errorLogs = JSON.parse(localStorage.getItem('dbErrorLogs') || '[]');
    errorLogs.push({
      type: processedError.type,
      message: processedError.message,
      timestamp: processedError.timestamp,
      details: processedError.originalError.message
    });
    
    // Mantener solo los últimos 50 errores
    if (errorLogs.length > 50) {
      errorLogs.shift();
    }
    
    localStorage.setItem('dbErrorLogs', JSON.stringify(errorLogs));
  } catch (e) {
    console.error('Error guardando log de errores:', e);
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
