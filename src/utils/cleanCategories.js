import db from './database';

/**
 * Limpia las categorías antiguas y asegura que solo existan las nuevas sin duplicados
 */
export const limpiarCategorias = async () => {
  try {
    console.log("Iniciando limpieza de categorías...");
    
    // 1. Obtener todas las categorías existentes
    const categoriasExistentes = await db.categorias.toArray();
    
    // 2. Definir las categorías válidas
    const categoriasNuevas = [
      { nombre: 'Luz', descripcion: 'Gastos de electricidad', color: '#f39c12' },
      { nombre: 'Agua', descripcion: 'Gastos de agua potable', color: '#3498db' },
      { nombre: 'Gas', descripcion: 'Gastos de gas doméstico', color: '#e74c3c' },
      { nombre: 'Internet', descripcion: 'Gastos de conexión a internet', color: '#9b59b6' },
      { nombre: 'Utiles de Aseo', descripcion: 'Gastos en productos de limpieza', color: '#2ecc71' },
      { nombre: 'Otros', descripcion: 'Otros gastos no categorizados', color: '#95a5a6' }
    ];
    
    // 3. Verificar qué categorías conservar y cuáles eliminar
    const nombresCategoriasValidas = categoriasNuevas.map(c => c.nombre);
    
    // Identificar categorías a eliminar (no válidas o duplicadas)
    const idsAEliminar = [];
    const nombresVistos = new Set();
    
    categoriasExistentes.forEach(categoria => {
      // Eliminar si no es una categoría válida o si ya hemos visto este nombre (duplicado)
      if (!nombresCategoriasValidas.includes(categoria.nombre) || nombresVistos.has(categoria.nombre)) {
        idsAEliminar.push(categoria.id);
      } else {
        nombresVistos.add(categoria.nombre);
      }
    });
    
    // 4. Eliminar categorías no válidas o duplicadas
    if (idsAEliminar.length > 0) {
      await db.categorias.bulkDelete(idsAEliminar);
      console.log(`Se eliminaron ${idsAEliminar.length} categorías inválidas o duplicadas`);
    }
    
    // 5. Añadir categorías nuevas que falten
    for (const categoriaNueva of categoriasNuevas) {
      // Verificar si ya existe esta categoría
      const existe = await db.categorias
        .where('nombre')
        .equals(categoriaNueva.nombre)
        .count();
      
      if (existe === 0) {
        await db.categorias.add(categoriaNueva);
        console.log(`Categoría añadida: ${categoriaNueva.nombre}`);
      }
    }
    
    console.log("Limpieza de categorías completada. Las categorías están normalizadas.");
    return true;
  } catch (error) {
    console.error("Error al limpiar categorías:", error);
    return false;
  }
};
