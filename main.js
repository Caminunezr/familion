const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
let isDev;

app.whenReady().then(async () => {
  isDev = (await import('electron-is-dev')).default;
  let fileStorage, database;

  try {
    // Importa los módulos nativos de almacenamiento local
    fileStorage = require('./electron/fileStorage');
    database = require('./electron/database');
    console.log('[main.js] Módulos de almacenamiento local importados correctamente.');
  } catch (err) {
    console.error('[main.js] Error al importar módulos de almacenamiento local:', err);
  }

  function createWindow() {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: isDev
          ? path.join(__dirname, 'preload.js')
          : path.join(__dirname, 'build', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        enableRemoteModule: false // recomendado por seguridad
      },
    });
    win.loadURL(
      isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, 'build', 'index.html')}`
    );
  }

  // Handlers IPC solo si los módulos se importaron correctamente
  if (fileStorage) {
    ipcMain.handle('guardar-archivo-local', async (event, { fileBuffer, options }) => {
      try {
        return fileStorage.guardarArchivoLocal(Buffer.from(fileBuffer), options);
      } catch (err) {
        console.error('[main.js] Error en guardar-archivo-local:', err);
        throw err;
      }
    });
    ipcMain.handle('obtener-archivos-por-cuenta', async (event, cuentaId) => {
      try {
        return fileStorage.obtenerArchivosPorCuenta(cuentaId);
      } catch (err) {
        console.error('[main.js] Error en obtener-archivos-por-cuenta:', err);
        throw err;
      }
    });
  }

  createWindow();
});
