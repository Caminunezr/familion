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

/**
 * Migración para actualizar todas las categorías antiguas a las nuevas
 */
export const migrarCategoriasAntiguas = async () => {
  try {
    console.log("Iniciando migración de categorías antiguas...");
    
    // Mapeo de categorías antiguas a nuevas (convertir a minúsculas para comparación insensible)
    const mapeoCategoriasAntiguas = {
      'servicios': 'Luz',
      'alimentos': 'Agua',
      'transporte': 'Gas',
      'entretenimiento': 'Internet',
      'salud': 'Utiles de Aseo',
      'educacion': 'Otros',
      'otros': 'Otros' // Incluir "otros" para normalizar
    };
    
    // 1. Actualizar cuentas
    const cuentas = await db.cuentas.toArray();
    let cuentasActualizadas = 0;
    
    for (const cuenta of cuentas) {
      if (cuenta.categoria) {
        const categoriaLower = cuenta.categoria.toLowerCase();
        if (Object.keys(mapeoCategoriasAntiguas).includes(categoriaLower)) {
          const nuevaCategoria = mapeoCategoriasAntiguas[categoriaLower];
          await db.cuentas.update(cuenta.id, {
            categoria: nuevaCategoria,
            categoriaEspecifica: nuevaCategoria === 'Otros' ? cuenta.categoria : null
          });
          cuentasActualizadas++;
        }
      }
    }
    
    // 2. Actualizar presupuestos
    const presupuestos = await db.presupuestos.toArray();
    let presupuestosActualizados = 0;
    
    for (const presupuesto of presupuestos) {
      if (presupuesto.categoria) {
        const categoriaLower = presupuesto.categoria.toLowerCase();
        if (Object.keys(mapeoCategoriasAntiguas).includes(categoriaLower)) {
          const nuevaCategoria = mapeoCategoriasAntiguas[categoriaLower];
          await db.presupuestos.update(presupuesto.id, {
            categoria: nuevaCategoria,
            categoriaEspecifica: nuevaCategoria === 'Otros' ? presupuesto.categoria : null
          });
          presupuestosActualizados++;
        }
      }
    }
    
    console.log(`Migración completada: ${cuentasActualizadas} cuentas y ${presupuestosActualizados} presupuestos actualizados`);
    return { cuentasActualizadas, presupuestosActualizados };
  } catch (error) {
    console.error("Error durante la migración de categorías:", error);
    throw error;
  }
};

export default {
  migrarCategoriasAntiguas
};
