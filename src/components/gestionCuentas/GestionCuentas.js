import React, { useState, useEffect } from 'react';
// ... otros imports (db, useAuth, NavBar, CSS, etc.)

// Define el estado inicial fuera del componente para reutilizarlo
const estadoInicialFormulario = {
  id: null, // Asegurarse que id sea null para nueva cuenta
  nombre: '',
  monto: '',
  fechaVencimiento: '',
  categoria: '',
  proveedor: '',
  descripcion: '',
  facturaUrl: '',
  creadorNombre: '',
  // ... otros campos si existen
};

const GestionCuentas = () => {
  // ... (otros estados: cuentas, editingCuenta, showForm, loading, etc.)
  const [formData, setFormData] = useState(estadoInicialFormulario); // Usar estado inicial
  const [categorias, setCategorias] = useState([]);

  // Definir proveedores por categoría
  const proveedoresPorCategoria = {
    Luz: ['Enel'],
    Agua: ['Aguas Andinas'],
    Internet: ['Mundo', 'Entel', 'Wom', 'Claro', 'VTR'],
    Gas: ['Lipigas', 'Gasco', 'Abastible'],
    'Utiles de Aseo': [], // Sin proveedor específico
    Otros: [], // Sin proveedor específico
  };

  // Cargar categorías (ejemplo, ajustar según tu implementación)
  useEffect(() => {
    const loadCategorias = async () => {
      // const cats = await db.categorias.toArray(); // O tu método para obtenerlas
      // setCategorias(cats.map(c => c.nombre));
      // Simulación si no las cargas de DB:
      setCategorias(['Luz', 'Agua', 'Gas', 'Internet', 'Utiles de Aseo', 'Otros']);
    };
    loadCategorias();
  }, []);

  // Efecto para resetear/fijar proveedor cuando cambia la categoría
  useEffect(() => {
    const categoriaSeleccionada = formData.categoria;
    // --- Añadir Log para depuración ---
    console.log(`Categoría cambió a: ${categoriaSeleccionada}, Proveedor actual: ${formData.proveedor}`);
    // --- Fin Log ---

    if (!categoriaSeleccionada) {
      if (formData.proveedor !== '') {
        console.log('Limpiando proveedor porque no hay categoría');
        setFormData(prev => ({ ...prev, proveedor: '' }));
      }
      return;
    }

    if (proveedoresPorCategoria.hasOwnProperty(categoriaSeleccionada)) {
      const proveedores = proveedoresPorCategoria[categoriaSeleccionada];

      if (proveedores.length === 1) {
        if (formData.proveedor !== proveedores[0]) {
          console.log(`Fijando proveedor a: ${proveedores[0]}`);
          setFormData(prev => ({ ...prev, proveedor: proveedores[0] }));
        }
      } else if (proveedores.length === 0) {
        if (formData.proveedor !== '') {
          console.log('Limpiando proveedor para categoría sin proveedor específico');
          setFormData(prev => ({ ...prev, proveedor: '' }));
        }
      } else {
        if (!proveedores.includes(formData.proveedor)) {
          console.log('Reseteando proveedor porque el actual no es válido para la nueva categoría');
          setFormData(prev => ({ ...prev, proveedor: '' }));
        }
      }
    } else {
      if (formData.proveedor !== '') {
         console.log('Limpiando proveedor porque la categoría no está mapeada');
         setFormData(prev => ({ ...prev, proveedor: '' }));
      }
    }
  }, [formData.categoria]); // La dependencia es correcta

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // --- Añadir Log para depuración ---
    console.log(`Input change: name=${name}, value=${value}`);
    // --- Fin Log ---
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Función para abrir el formulario para una NUEVA cuenta
  const handleAbrirFormularioNuevo = () => {
    console.log('Abriendo formulario para NUEVA cuenta, reseteando formData');
    setFormData(estadoInicialFormulario); // Resetear al estado inicial
    // setShowForm(true); // Mostrar el formulario (ajusta según tu lógica)
  };

  // Lógica para manejar el submit (handleGuardarCuenta)
  const handleGuardarCuenta = async (e) => {
    e.preventDefault();
    // Validaciones adicionales si son necesarias
    try {
      // Lógica para guardar/actualizar en DB usando formData
      // ...
      console.log('Guardando cuenta:', formData);
      // Resetear formulario, cerrar, etc.
      // ...
    } catch (error) {
      console.error("Error guardando cuenta:", error);
      // Mostrar notificación de error
    }
  };

  // Lógica para editar (handleEditarCuenta) - Asegúrate de popular formData
  const handleEditarCuenta = (cuenta) => {
    console.log('Abriendo formulario para EDITAR cuenta:', cuenta);
    setFormData({
      id: cuenta.id, // Importante para actualizar
      nombre: cuenta.nombre || '',
      monto: cuenta.monto || '',
      fechaVencimiento: cuenta.fechaVencimiento ? cuenta.fechaVencimiento.split('T')[0] : '', // Formato YYYY-MM-DD para input date
      categoria: cuenta.categoria || '',
      proveedor: cuenta.proveedor || '',
      descripcion: cuenta.descripcion || '',
      facturaUrl: cuenta.facturaUrl || '',
      creadorNombre: cuenta.creadorNombre || '',
      // ... otros campos
    });
    // setShowForm(true); // Mostrar el formulario
  };

  // Determinar qué proveedores mostrar basado en la categoría seleccionada
  const proveedoresDisponibles = formData.categoria && proveedoresPorCategoria.hasOwnProperty(formData.categoria)
    ? proveedoresPorCategoria[formData.categoria]
    : [];
  const mostrarCampoProveedor = proveedoresDisponibles.length > 0;
  const esProveedorFijo = proveedoresDisponibles.length === 1;
  const esProveedorSeleccionable = proveedoresDisponibles.length > 1;
  const mostrarCampoDescripcion = formData.categoria === 'Otros' || formData.categoria === 'Utiles de Aseo';

  return (
    <div className="gestion-cuentas-page">
      {/* Asegúrate de llamar a handleAbrirFormularioNuevo desde el botón "Nueva Cuenta" */}
      <button onClick={handleAbrirFormularioNuevo}>Nueva Cuenta</button>
      {/* ... NavBar, Título, Botón para mostrar formulario ... */}

      {/* Asumiendo que tienes un estado showForm para el modal/panel */}
      {/* {showForm && ( */}
        <div className="form-container"> {/* O tu clase para el modal/panel */}
          <h3>{formData.id ? 'Editar Cuenta' : 'Nueva Cuenta'}</h3>
          <form onSubmit={handleGuardarCuenta}>

            {/* Campo Nombre */}
            <div className="form-group">
              <label htmlFor="nombre">Nombre de la Cuenta *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Campo Categoría */}
            <div className="form-group">
              <label htmlFor="categoria">Categoría *</label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Campo Proveedor (Condicional) */}
            {mostrarCampoProveedor && (
              <div className="form-group">
                <label htmlFor="proveedor">Proveedor *</label>
                {esProveedorFijo ? (
                  // Mostrar valor fijo (input deshabilitado o solo texto)
                  <input
                    type="text"
                    id="proveedor"
                    name="proveedor"
                    value={formData.proveedor} // Ya fijado por el useEffect
                    readOnly // O disabled
                    className="form-input-disabled" // Clase opcional para estilo
                  />
                  // Alternativa: solo mostrar texto
                  // <p style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#eee' }}>
                  //   {formData.proveedor}
                  // </p>
                ) : esProveedorSeleccionable ? (
                  // Mostrar select para Internet o Gas
                  <select
                    id="proveedor"
                    name="proveedor"
                    value={formData.proveedor}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecciona un proveedor</option>
                    {proveedoresDisponibles.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                ) : null /* No debería llegar aquí si mostrarCampoProveedor es true */}
              </div>
            )}

            {/* Campo Descripción (Condicional) */}
            {mostrarCampoDescripcion && (
              <div className="form-group">
                {/* Ajustar label si es necesario */}
                <label htmlFor="descripcion">Descripción / Detalles *</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  rows="3"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder={formData.categoria === 'Otros' ? 'Ej: Reparación auto, Regalo cumpleaños...' : 'Ej: Cloro, Lavaloza, Papel higiénico...'}
                  required // Hacerlo requerido si es necesario para estas categorías
                ></textarea>
              </div>
            )}

            {/* Campo Monto */}
            <div className="form-group">
              <label htmlFor="monto">Monto *</label>
              <input
                type="number"
                id="monto"
                name="monto"
                min="0"
                step="1" // O el step que prefieras
                value={formData.monto}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Campo Fecha Vencimiento */}
            <div className="form-group">
              <label htmlFor="fechaVencimiento">Fecha Vencimiento *</label>
              <input
                type="date"
                id="fechaVencimiento"
                name="fechaVencimiento"
                value={formData.fechaVencimiento}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Campo Creador (Asumiendo que existe) */}
            <div className="form-group">
              <label htmlFor="creadorNombre">Creador *</label>
              <select
                id="creadorNombre"
                name="creadorNombre"
                value={formData.creadorNombre}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled>Selecciona quién crea</option>
                {/* Asumiendo que tienes la lista nombresCreadores */}
                {['Camilo', 'Chave', 'Daniela', 'Mia'].map(nombre => (
                  <option key={nombre} value={nombre}>{nombre}</option>
                ))}
              </select>
            </div>

            {/* Campo Factura URL (Opcional) */}
            {/* ... */}

            {/* Botones de acción */}
            <div className="form-buttons">
              <button type="submit" disabled={loading}> {/* Asumiendo estado loading */}
                {formData.id ? 'Actualizar Cuenta' : 'Guardar Cuenta'}
              </button>
              <button type="button" onClick={() => { /* Lógica para cancelar/cerrar */ }}>
                Cancelar
              </button>
            </div>

          </form>
        </div>
      {/* )} */}

      {/* ... Resto del componente (Tabla de cuentas, etc.) ... */}
    </div>
  );
};

export default GestionCuentas;
