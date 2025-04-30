const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('api', {
  guardarArchivoLocal: (fileBuffer, options) => ipcRenderer.invoke('guardar-archivo-local', { fileBuffer, options }),
  obtenerArchivosPorCuenta: (cuentaId) => ipcRenderer.invoke('obtener-archivos-por-cuenta', cuentaId),
  leerArchivoComoDataUrl: (ruta) => {
    return new Promise((resolve, reject) => {
      fs.readFile(ruta, (err, data) => {
        if (err) return reject(err);
        const ext = path.extname(ruta).toLowerCase();
        let mime = 'application/octet-stream';
        if (ext === '.png') mime = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
        if (ext === '.pdf') mime = 'application/pdf';
        // Agrega más tipos si necesitas
        const base64 = data.toString('base64');
        resolve(`data:${mime};base64,${base64}`);
      });
    });
  }
});
