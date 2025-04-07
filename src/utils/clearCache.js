import db from './database';
import fileDB from './fileStorage';

export const clearAllData = async () => {
  try {
    console.log("Eliminando todas las bases de datos...");
    
    // Eliminar bases de datos de la aplicación
    await db.delete();
    await fileDB.delete();
    
    console.log("Bases de datos eliminadas. Recarga la aplicación para reinicializarlas.");
    
    // Opcional: Recargar la aplicación
    window.location.reload();
    
    return true;
  } catch (error) {
    console.error("Error al borrar datos:", error);
    return false;
  }
};

// Esta función solo elimina los datos pero mantiene la estructura
export const clearAllDataButKeepStructure = async () => {
  try {
    console.log("Eliminando todos los datos...");
    
    // Eliminar datos de cada tabla pero mantener la estructura
    await db.cuentas.clear();
    await db.pagos.clear();
    await db.presupuestos.clear(); 
    await db.aportes.clear();
    // No limpiamos categorías para mantener las predeterminadas
    
    // Limpiar archivos
    await fileDB.files.clear();
    
    console.log("Datos eliminados correctamente");
    return true;
  } catch (error) {
    console.error("Error al borrar datos:", error);
    return false;
  }
};
