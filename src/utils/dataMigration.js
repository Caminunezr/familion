import db from './database';

export const migratePresupuestos = async () => {
  try {
    // Obtener todos los presupuestos
    const presupuestos = await db.presupuestos.toArray();
    
    // Filtrar los que tienen montoObjetivo pero no montoAporte
    const presupuestosParaMigrar = presupuestos.filter(
      p => p.montoObjetivo && !p.montoAporte
    );
    
    // Actualizar cada presupuesto
    for (const presupuesto of presupuestosParaMigrar) {
      await db.presupuestos.update(presupuesto.id, {
        montoAporte: presupuesto.montoObjetivo,
        // Conservamos montoObjetivo por retrocompatibilidad
      });
    }
    
    console.log(`Migrados ${presupuestosParaMigrar.length} presupuestos`);
    return true;
  } catch (error) {
    console.error('Error en migración:', error);
    return false;
  }
};
