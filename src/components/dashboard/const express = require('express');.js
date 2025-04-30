const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose(); // Importa sqlite3
const { open } = require('sqlite'); // Importa open de sqlite

const app = express();
const PORT = process.env.PORT || 3001; // Puerto para el backend

// --- Middleware ---
app.use(cors()); // Habilitar CORS para todas las rutas
app.use(express.json()); // Para parsear body de requests como JSON

// --- Base de Datos SQLite ---
let db;

// Función asíncrona para abrir la base de datos
async function initializeDatabase() {
  try {
    db = await open({
      filename: './familion_data.db', // Nombre del archivo de la base de datos
      driver: sqlite3.Database
    });
    console.log('Conectado a la base de datos SQLite.');

    // Crear tablas si no existen (ejemplo para cuentas)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS cuentas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        monto REAL NOT NULL,
        fechaVencimiento TEXT NOT NULL,
        categoria TEXT,
        proveedor TEXT,
        descripcion TEXT,
        facturaUrl TEXT,
        creadorNombre TEXT NOT NULL,
        estaPagada INTEGER DEFAULT 0, -- 0 para false, 1 para true
        fechaCreacion TEXT DEFAULT CURRENT_TIMESTAMP,
        fechaActualizacion TEXT
      );
    `);
    // Aquí podrías añadir CREATE TABLE para pagos, presupuestos, aportes, usuarios, etc.
    console.log('Tablas aseguradas/creadas.');

  } catch (err) {
    console.error('Error al conectar/inicializar la base de datos:', err.message);
    process.exit(1); // Salir si no se puede conectar a la DB
  }
}

// --- Rutas de la API ---

// Ruta de prueba
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Ejemplo: Obtener todas las cuentas
app.get('/api/cuentas', async (req, res) => {
  try {
    const cuentas = await db.all('SELECT * FROM cuentas ORDER BY fechaCreacion DESC');
    res.json(cuentas);
  } catch (err) {
    console.error('Error al obtener cuentas:', err.message);
    res.status(500).json({ error: 'Error interno del servidor al obtener cuentas' });
  }
});

// Ejemplo: Crear una nueva cuenta
app.post('/api/cuentas', async (req, res) => {
  const { nombre, monto, fechaVencimiento, categoria, proveedor, descripcion, facturaUrl, creadorNombre } = req.body;

  // Validación básica (puedes añadir más)
  if (!nombre || !monto || !fechaVencimiento || !creadorNombre) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const result = await db.run(
      `INSERT INTO cuentas (nombre, monto, fechaVencimiento, categoria, proveedor, descripcion, facturaUrl, creadorNombre, fechaActualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, monto, fechaVencimiento, categoria, proveedor, descripcion, facturaUrl, creadorNombre, new Date().toISOString()]
    );
    // Obtener la cuenta recién creada para devolverla
    const nuevaCuenta = await db.get('SELECT * FROM cuentas WHERE id = ?', result.lastID);
    res.status(201).json(nuevaCuenta);
  } catch (err) {
    console.error('Error al crear cuenta:', err.message);
    res.status(500).json({ error: 'Error interno del servidor al crear cuenta' });
  }
});

// --- Iniciar Servidor ---
// Llama a la inicialización de la DB y luego inicia el servidor Express
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend escuchando en http://localhost:${PORT}`);
  });
}).catch(err => {
  // El error ya se logueó en initializeDatabase
  console.error("No se pudo iniciar el servidor debido a un error de base de datos.");
});
